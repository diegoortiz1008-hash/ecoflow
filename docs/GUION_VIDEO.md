# Guion del Video Demo (≈ 4 min)

> **Antes de grabar:** `npm install && npm run dev`, y abre la app en el navegador. Para la parte de la consola de Supabase, crea un proyecto gratuito en supabase.com y aplica la migración y el seed (ver [ARQUITECTURA.md §7](ARQUITECTURA.md#7-conectar-con-supabase-real)). Graba con **Win + G** (Xbox Game Bar) u OBS Studio a 1080p.

| Tiempo | Pantalla | Qué mostrar | Qué decir (sugerido) |
|---|---|---|---|
| 0:00 – 0:20 | README en GitHub | Título, stack, tabla de entregables | "EcoFlow es una app interna para gestionar instalaciones solares, hecha con React, TypeScript y Supabase usando una arquitectura basada en especificaciones." |
| 0:20 – 0:50 | `docs/ESPECIFICACION_TECNICA.md` | Bloque del prompt maestro y la tabla de trazabilidad | "Antes de escribir código definí el contrato: reglas RN, de seguridad SEG y de interfaz UI. Cada regla tiene un ID que aparece en el SQL, en el código y en las pruebas." |
| 0:50 – 1:30 | **Consola de Supabase → Table Editor** y **Database → Schema Visualizer** | Las 4 tablas, las FK y el diagrama | "Proyectos, instaladores, materiales y una tabla puente con clave compuesta. Fíjense en ON DELETE RESTRICT en materiales para no perder el histórico de costos." |
| 1:30 – 2:00 | **Supabase → Authentication → Policies** | Las políticas de `proyectos` | "El rol sale de app_metadata, que solo escribe el servidor. El instalador solo ve sus proyectos asignados, y un trigger le impide cambiar algo distinto del estado." |
| 2:00 – 2:40 | App · sesión **Coordinador** | KPIs, columnas por estado, filtro por ciudad, "+ Nuevo proyecto" con errores (capacidad 20000, fechas al revés, Carla inactiva) y luego datos válidos | "El formulario valida las mismas reglas que la base de datos antes de enviar. Al corregir, el proyecto aparece en Pendiente y los KPIs se actualizan." |
| 2:40 – 3:10 | App · cambiar a **Ana Ríos** (selector arriba a la derecha) | Solo 2 proyectos, sin botón de crear; pulsar "Completar →" | "Con la sesión de Ana, RLS solo devuelve sus proyectos. El cambio de estado es optimista: se ve al instante y se confirma con la base de datos." |
| 3:10 – 3:40 | `docs/ARQUITECTURA.md` §5.3 + terminal con `docs/rls-test-log.txt` | Prueba 14 (vista insegura: 4 vs segura: 2) | "El problema técnico más interesante: una vista normal se ejecuta como su dueño y se salta el RLS. Con security_invoker = true respeta los permisos del usuario. Lo dejé cubierto con una prueba." |
| 3:40 – 4:00 | `docs/tipos/diff-borrador-vs-generado.diff` + terminal `npm test` | Diff (`Date` vs `string`, `string \| null`) y "20 passed" | "No pegué los tipos de la IA a ciegas: los generé desde el esquema real y encontré 5 errores. Todo queda verificado con 20 tests de frontend y 15 de base de datos." |

**Consejos:** aumenta el zoom del navegador al 125 %, cierra las notificaciones y ten preparadas las pestañas en este orden: GitHub → especificación → Supabase → app → arquitectura → terminal.
