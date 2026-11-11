-- =============================================================================
-- Pruebas del esquema EcoFlow: RLS + reglas de negocio. Cada prueba imprime OK o aborta.
-- Ejecutar sobre: 00_supabase_stubs.sql + migración + seed.sql
-- =============================================================================
\set ON_ERROR_STOP on
set client_min_messages = notice;

-- ============ Como ANA (instaladora) ============
select public.test_login('00000000-0000-0000-0000-0000000000a1', 'instalador') \gset
set role authenticated;

do $$ begin
  assert (select count(*) from public.proyectos) = 2, 'Ana debería ver solo sus 2 proyectos';
  assert not exists (select 1 from public.proyectos where instalador_id <> '10000000-0000-0000-0000-00000000000a'), 've proyectos ajenos';
  raise notice 'OK 1  SEG-2 Ana (instaladora) ve solo sus 2 proyectos asignados de 4';
end $$;

do $$ begin
  assert (select count(*) from public.instaladores) = 1, 've fichas ajenas';
  assert (select count(*) from public.proyecto_materiales) = 4, 'materiales de sus proyectos';
  raise notice 'OK 2  SEG-2 Ana ve solo su ficha y los materiales de SUS proyectos';
end $$;

do $$ begin
  begin
    insert into public.proyectos (nombre, cliente, ciudad, capacidad_kw, fecha_inicio, fecha_fin_estimada)
    values ('Intento', 'X S.A.', 'Cali', 10, '2026-12-01', '2026-12-31');
    raise exception 'FALLO: instaladora creó un proyecto';
  exception when insufficient_privilege then
    raise notice 'OK 3  SEG-3 una instaladora no puede crear proyectos';
  end;
end $$;

do $$ begin
  begin
    update public.proyectos set capacidad_kw = 999 where id = '30000000-0000-0000-0000-000000000001';
    raise exception 'FALLO: instaladora cambió la capacidad';
  exception when insufficient_privilege then
    raise notice 'OK 4  SEG-2 una instaladora solo puede cambiar el estado (no capacidad, fechas ni asignación)';
  end;
end $$;

do $$ declare n int; begin
  update public.proyectos set estado = 'en_progreso' where id = '30000000-0000-0000-0000-000000000002'; -- de Bruno
  get diagnostics n = row_count;
  assert n = 0, 'actualizó proyecto ajeno';
  raise notice 'OK 5  SEG-2 una instaladora no puede tocar proyectos de otro (0 filas)';
end $$;

do $$ begin
  begin
    update public.proyectos set estado = 'pendiente' where id = '30000000-0000-0000-0000-000000000001';
    raise exception 'FALLO: retrocedió el estado';
  exception when check_violation then
    raise notice 'OK 6  RN-4 la instaladora no puede retroceder el estado (en_progreso -> pendiente)';
  end;
end $$;

update public.proyectos set estado = 'completado' where id = '30000000-0000-0000-0000-000000000001';
do $$ begin raise notice 'OK 7  RN-4 la instaladora avanza su proyecto en_progreso -> completado'; end $$;
reset role;

-- ============ Como COORDINADOR ============
select public.test_login('00000000-0000-0000-0000-0000000000c1', 'coordinador') \gset
set role authenticated;

do $$ begin
  assert (select count(*) from public.proyectos) = 4, 'coordinador debe ver todo';
  raise notice 'OK 8  SEG-3 el coordinador ve los 4 proyectos';
end $$;

do $$ begin
  begin
    update public.proyectos set estado = 'en_progreso' where id = '30000000-0000-0000-0000-000000000004'; -- sin instalador
    raise exception 'FALLO: en_progreso sin instalador';
  exception when check_violation then
    raise notice 'OK 9  RN-3 no se puede iniciar un proyecto sin instalador asignado';
  end;
  begin
    update public.proyectos set instalador_id = '10000000-0000-0000-0000-00000000000c' where id = '30000000-0000-0000-0000-000000000004';
    raise exception 'FALLO: asignó instalador inactivo';
  exception when check_violation then
    raise notice 'OK 10 RN-5 no se puede asignar un instalador inactivo (Carla)';
  end;
  begin
    insert into public.proyectos (nombre, cliente, ciudad, capacidad_kw, fecha_inicio, fecha_fin_estimada)
    values ('Fechas al revés', 'Y S.A.', 'Cali', 10, '2026-12-31', '2026-12-01');
    raise exception 'FALLO: fechas inválidas';
  exception when check_violation then
    raise notice 'OK 11 RN-2 la fecha fin no puede ser anterior al inicio';
  end;
  begin
    insert into public.proyectos (nombre, cliente, ciudad, capacidad_kw, fecha_inicio, fecha_fin_estimada)
    values ('Demasiado grande', 'Z S.A.', 'Cali', 20000, '2026-12-01', '2026-12-31');
    raise exception 'FALLO: capacidad fuera de rango';
  exception when check_violation then
    raise notice 'OK 12 RN-1 capacidad > 10.000 kW rechazada';
  end;
end $$;

do $$ declare c numeric; begin
  select costo_materiales into c from public.v_proyectos_resumen where id = '30000000-0000-0000-0000-000000000001';
  assert c = 220 * 780000 + 12 * 6900000, 'costo mal calculado';
  raise notice 'OK 13 RN-6 costo de materiales del proyecto = % (220 paneles + 12 inversores)', c;
end $$;
reset role;

-- ============ El problema técnico: vistas y RLS ============
-- Una vista SIN security_invoker se ejecuta con los permisos de su DUEÑO (postgres),
-- que se salta el RLS: la instaladora vería TODOS los proyectos.
create view public.v_insegura as select id, nombre, instalador_id from public.proyectos;
grant select on public.v_insegura to authenticated;

select public.test_login('00000000-0000-0000-0000-0000000000a1', 'instalador') \gset
set role authenticated;
do $$ declare insegura int; segura int; begin
  select count(*) into insegura from public.v_insegura;
  select count(*) into segura from public.v_proyectos_resumen;
  assert insegura = 4 and segura = 2, 'comportamiento de vistas inesperado';
  raise notice 'OK 14 SEG-6 vista sin security_invoker FILTRA % proyectos; v_proyectos_resumen (security_invoker) solo %', insegura, segura;
end $$;
reset role;
drop view public.v_insegura;

-- ============ Anónimo ============
select public.test_login(null) \gset
set role anon;
do $$ begin
  begin
    perform 1 from public.proyectos;
    raise exception 'FALLO: anon leyó proyectos';
  exception when insufficient_privilege then
    raise notice 'OK 15 SEG-5 usuarios anónimos no acceden a nada';
  end;
end $$;
reset role;

do $$ begin raise notice '=== 15/15 PRUEBAS DE ESQUEMA Y RLS OK ==='; end $$;
