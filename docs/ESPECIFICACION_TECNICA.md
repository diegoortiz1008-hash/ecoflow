# Especificación Técnica: EcoFlow (Prompt Maestro)

> Este documento es el **contrato** que guía a la IA y al equipo. Se pega completo al inicio de cada sesión con el asistente, y cada prompt posterior hace referencia a sus identificadores (`RN-x`, `SEG-x`, `UI-x`). Si el código contradice este documento, el código está mal.

```text
## ROL
Actúa como Arquitecto de Software Senior (React 19 + TypeScript strict + Vite + Supabase/PostgreSQL 15+).
Escribes código de producción, modular y tipado. No inventas tablas ni columnas que no estén en
esta especificación; si falta algo, PREGUNTA antes de suponer.

## CONTEXTO DE NEGOCIO
EcoFlow es una app INTERNA de una startup de energía solar para gestionar proyectos de instalación
de paneles. Usuarios:
- Coordinador: crea y asigna proyectos, ve todo, gestiona materiales e instaladores.
- Instalador: ve SOLO los proyectos asignados a él y actualiza su estado.

## MODELO DE DATOS (Supabase / PostgreSQL)
instaladores(id uuid PK, user_id uuid UNIQUE FK auth.users, nombre, email UNIQUE, telefono,
             certificacion enum[basica|avanzada|experto], activo bool, created_at)
proyectos(id uuid PK, nombre, cliente, ciudad, direccion, capacidad_kw numeric(8,2),
          estado enum[pendiente|en_progreso|completado], fecha_inicio date, fecha_fin_estimada date,
          instalador_id uuid FK instaladores NULL, created_by uuid FK auth.users, created_at, updated_at)
materiales(id uuid PK, nombre, sku UNIQUE, unidad enum[unidad|metro|kg], costo_unitario numeric(12,2), stock int)
proyecto_materiales(proyecto_id FK proyectos ON DELETE CASCADE, material_id FK materiales
                    ON DELETE RESTRICT, cantidad int, PK(proyecto_id, material_id))

## REGLAS DE NEGOCIO
RN-1 capacidad_kw > 0 y <= 10.000 kW.
RN-2 fecha_fin_estimada >= fecha_inicio.
RN-3 Un proyecto "en_progreso" o "completado" DEBE tener instalador asignado.
RN-4 El estado solo avanza: pendiente -> en_progreso -> completado. El coordinador puede
     corregir cualquier transición; el instalador solo puede avanzar un paso.
RN-5 Solo se asignan instaladores activos.
RN-6 Costo de materiales de un proyecto = SUM(cantidad * costo_unitario).
RN-7 Stock y costos nunca negativos; cantidad > 0.

## SEGURIDAD (RLS obligatorio en TODAS las tablas)
SEG-1 El rol se lee de auth.jwt()->'app_metadata'->>'role' (lo asigna el servidor), NUNCA de
      user_metadata (editable por el usuario).
SEG-2 Instalador: SELECT solo de proyectos con instalador_id = su id, y de su propia fila en
      instaladores. UPDATE solo de proyectos asignados, y SOLO la columna estado (RN-4).
SEG-3 Coordinador: CRUD completo.
SEG-4 Materiales: lectura para autenticados; escritura solo coordinador.
SEG-5 anon: sin acceso a nada (app interna).
SEG-6 Funciones SECURITY DEFINER con `set search_path = ''`. Vistas con security_invoker = true.
SEG-7 El frontend solo usa la anon key.

## FRONTEND
UI-1 Dashboard: KPIs (total, por estado, kW totales, costo de materiales) y proyectos agrupados
     por estado (Pendiente, En Progreso, Completado), con búsqueda y filtro por ciudad.
UI-2 Formulario "Nuevo proyecto" (solo coordinador) con validación en cliente que replique
     RN-1, RN-2, RN-3 y RN-5 antes de enviar a Supabase, con mensajes por campo.
UI-3 Estados de carga (skeleton), error (con reintentar) y vacío en todas las vistas.
UI-4 Lógica de datos en custom hooks (useProyectos, useInstaladores, useMateriales); los
     componentes no importan supabase-js.
UI-5 Tailwind CSS con componentes base reutilizables (Button, Card, Badge, Input, Select)
     al estilo shadcn/ui. Responsive y accesible (labels, aria-invalid, foco visible).
UI-6 Tipos TypeScript generados desde el esquema; prohibido `any`.

## FORMATO DE RESPUESTA ESPERADO
Archivos completos con su ruta como encabezado. Sin explicaciones fuera de los bloques de código,
salvo una lista final de "supuestos" si tuviste que asumir algo.
```

## Trazabilidad especificación → implementación

| ID | Dónde se cumple | Cómo se verifica |
|---|---|---|
| RN-1, RN-2, RN-7 | `CHECK` en la migración + `validateProyecto()` | `supabase/tests/rls_test.sql`, `validation.test.ts` |
| RN-3, RN-4, RN-5 | Trigger `validar_proyecto()` + validación en cliente | `rls_test.sql` (pruebas 6–9), `validation.test.ts` |
| RN-6 | Vista `v_proyectos_resumen` (security_invoker) | `rls_test.sql` (prueba 10) |
| SEG-1 … SEG-6 | Migración `..._esquema_ecoflow.sql` | `rls_test.sql` (pruebas 1–5, 11–12) |
| SEG-7 | `src/lib/supabase.ts` | `.env.example`, revisión de código |
| UI-1 … UI-6 | `src/components`, `src/hooks` | `useProyectos.test.tsx`, prueba en navegador, capturas |
