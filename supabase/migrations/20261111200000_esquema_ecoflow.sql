-- =============================================================================
-- EcoFlow · Esquema inicial
-- Implementa docs/ESPECIFICACION_TECNICA.md (RN-x = regla de negocio, SEG-x = seguridad)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tipos
-- -----------------------------------------------------------------------------
create type public.proyecto_estado   as enum ('pendiente', 'en_progreso', 'completado');
create type public.certificacion     as enum ('basica', 'avanzada', 'experto');
create type public.unidad_material   as enum ('unidad', 'metro', 'kg');

-- -----------------------------------------------------------------------------
-- 2. Tablas
-- -----------------------------------------------------------------------------
create table public.instaladores (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid unique references auth.users (id) on delete set null,
  nombre         text not null check (char_length(trim(nombre)) between 2 and 120),
  email          text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefono       text check (char_length(telefono) <= 30),
  certificacion  public.certificacion not null default 'basica',
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table public.proyectos (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null check (char_length(trim(nombre)) between 3 and 150),
  cliente             text not null check (char_length(trim(cliente)) between 2 and 150),
  ciudad              text not null check (char_length(trim(ciudad)) between 2 and 80),
  direccion           text check (char_length(direccion) <= 250),
  capacidad_kw        numeric(8, 2) not null check (capacidad_kw > 0 and capacidad_kw <= 10000), -- RN-1
  estado              public.proyecto_estado not null default 'pendiente',
  fecha_inicio        date not null,
  fecha_fin_estimada  date not null,
  instalador_id       uuid references public.instaladores (id) on delete set null,
  created_by          uuid references auth.users (id) on delete set null default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint proyectos_fechas_validas check (fecha_fin_estimada >= fecha_inicio),           -- RN-2
  constraint proyectos_estado_requiere_instalador                                            -- RN-3
    check (estado = 'pendiente' or instalador_id is not null)
);

create table public.materiales (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null check (char_length(trim(nombre)) between 2 and 120),
  sku             text not null unique check (sku ~ '^[A-Z0-9-]{3,30}$'),
  unidad          public.unidad_material not null default 'unidad',
  costo_unitario  numeric(12, 2) not null check (costo_unitario >= 0),                      -- RN-7
  stock           integer not null default 0 check (stock >= 0),                            -- RN-7
  created_at      timestamptz not null default now()
);

create table public.proyecto_materiales (
  proyecto_id  uuid not null references public.proyectos (id) on delete cascade,
  material_id  uuid not null references public.materiales (id) on delete restrict,
  cantidad     integer not null check (cantidad > 0),                                       -- RN-7
  primary key (proyecto_id, material_id)
);

-- Índices para FKs y para las columnas que usan las políticas RLS
create index proyectos_instalador_idx         on public.proyectos (instalador_id);
create index proyectos_estado_idx             on public.proyectos (estado);
create index proyecto_materiales_material_idx on public.proyecto_materiales (material_id);

-- -----------------------------------------------------------------------------
-- 3. Funciones auxiliares de seguridad (SEG-1, SEG-6)
-- -----------------------------------------------------------------------------
create or replace function public.is_coordinador()
returns boolean language sql stable set search_path = '' as $$
  select coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'coordinador';
$$;

-- id del instalador vinculado al usuario actual (NULL si no es instalador)
create or replace function public.mi_instalador_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select i.id from public.instaladores i where i.user_id = (select auth.uid()) and i.activo;
$$;

revoke execute on function public.mi_instalador_id() from public, anon;
grant  execute on function public.mi_instalador_id() to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Triggers de reglas de negocio
-- -----------------------------------------------------------------------------
create or replace function public.validar_proyecto()
returns trigger language plpgsql set search_path = '' as $$
declare
  orden constant public.proyecto_estado[] := array['pendiente', 'en_progreso', 'completado']::public.proyecto_estado[];
begin
  new.updated_at := now();

  -- RN-5: solo instaladores activos
  if new.instalador_id is not null and (tg_op = 'INSERT' or new.instalador_id is distinct from old.instalador_id) then
    if not exists (select 1 from public.instaladores where id = new.instalador_id and activo) then
      raise exception 'RN-5: el instalador asignado no existe o está inactivo' using errcode = '23514';
    end if;
  end if;

  -- RN-4 + SEG-2: el instalador solo cambia `estado`, y solo un paso hacia adelante
  if tg_op = 'UPDATE' and not public.is_coordinador() then
    if (new.nombre, new.cliente, new.ciudad, new.direccion, new.capacidad_kw, new.fecha_inicio,
        new.fecha_fin_estimada, new.instalador_id, new.created_by)
       is distinct from
       (old.nombre, old.cliente, old.ciudad, old.direccion, old.capacidad_kw, old.fecha_inicio,
        old.fecha_fin_estimada, old.instalador_id, old.created_by) then
      raise exception 'SEG-2: un instalador solo puede modificar el estado del proyecto' using errcode = '42501';
    end if;
    if new.estado is distinct from old.estado
       and array_position(orden, new.estado) <> array_position(orden, old.estado) + 1 then
      raise exception 'RN-4: transición de estado no permitida (% -> %)', old.estado, new.estado using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger proyectos_validar
  before insert or update on public.proyectos
  for each row execute function public.validar_proyecto();

-- -----------------------------------------------------------------------------
-- 5. Row Level Security (SEG-2 … SEG-5)
-- -----------------------------------------------------------------------------
alter table public.instaladores        enable row level security;
alter table public.proyectos           enable row level security;
alter table public.materiales          enable row level security;
alter table public.proyecto_materiales enable row level security;

revoke all on public.instaladores, public.proyectos, public.materiales, public.proyecto_materiales from anon; -- SEG-5

-- instaladores
create policy "instaladores: coordinador ve todos, instalador solo su ficha"
  on public.instaladores for select to authenticated
  using ((select public.is_coordinador()) or user_id = (select auth.uid()));
create policy "instaladores: solo coordinador escribe"
  on public.instaladores for all to authenticated
  using ((select public.is_coordinador())) with check ((select public.is_coordinador()));

-- proyectos
create policy "proyectos: coordinador ve todos, instalador solo los asignados"
  on public.proyectos for select to authenticated
  using ((select public.is_coordinador()) or instalador_id = (select public.mi_instalador_id()));
create policy "proyectos: solo coordinador crea"
  on public.proyectos for insert to authenticated
  with check ((select public.is_coordinador()));
create policy "proyectos: coordinador o instalador asignado actualiza"
  on public.proyectos for update to authenticated
  using ((select public.is_coordinador()) or instalador_id = (select public.mi_instalador_id()))
  with check ((select public.is_coordinador()) or instalador_id = (select public.mi_instalador_id()));
create policy "proyectos: solo coordinador elimina"
  on public.proyectos for delete to authenticated
  using ((select public.is_coordinador()));

-- materiales (SEG-4)
create policy "materiales: lectura para autenticados"
  on public.materiales for select to authenticated using (true);
create policy "materiales: solo coordinador escribe"
  on public.materiales for all to authenticated
  using ((select public.is_coordinador())) with check ((select public.is_coordinador()));

-- proyecto_materiales: visible si el proyecto es visible (RLS de proyectos aplica en la subconsulta)
create policy "proyecto_materiales: visible si el proyecto es visible"
  on public.proyecto_materiales for select to authenticated
  using (exists (select 1 from public.proyectos p where p.id = proyecto_id));
create policy "proyecto_materiales: solo coordinador escribe"
  on public.proyecto_materiales for all to authenticated
  using ((select public.is_coordinador())) with check ((select public.is_coordinador()));

-- -----------------------------------------------------------------------------
-- 6. Vista de resumen para el dashboard (RN-6)
--    security_invoker = true -> la vista respeta el RLS del usuario que consulta (SEG-6).
--    Sin esta opción la vista se ejecuta con los permisos de su dueño y EXPONE todos los proyectos.
-- -----------------------------------------------------------------------------
create view public.v_proyectos_resumen
with (security_invoker = true) as
select
  p.id,
  p.nombre,
  p.cliente,
  p.ciudad,
  p.capacidad_kw,
  p.estado,
  p.fecha_inicio,
  p.fecha_fin_estimada,
  p.instalador_id,
  i.nombre                                              as instalador_nombre,
  coalesce(sum(pm.cantidad * m.costo_unitario), 0)::numeric(14, 2) as costo_materiales,
  count(pm.material_id)::integer                        as total_materiales,
  p.updated_at
from public.proyectos p
left join public.instaladores i         on i.id = p.instalador_id
left join public.proyecto_materiales pm on pm.proyecto_id = p.id
left join public.materiales m           on m.id = pm.material_id
group by p.id, i.nombre;

revoke all on public.v_proyectos_resumen from anon;
grant select on public.v_proyectos_resumen to authenticated;
