-- Datos de ejemplo para EcoFlow (supabase db reset los carga automáticamente)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'coordinacion@ecoflow.co'),
  ('00000000-0000-0000-0000-0000000000a1', 'ana.rios@ecoflow.co'),
  ('00000000-0000-0000-0000-0000000000b1', 'bruno.diaz@ecoflow.co')
on conflict do nothing;

insert into public.instaladores (id, user_id, nombre, email, telefono, certificacion, activo) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', 'Ana Ríos',    'ana.rios@ecoflow.co',   '+57 310 555 0101', 'experto',  true),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1', 'Bruno Díaz',  'bruno.diaz@ecoflow.co', '+57 311 555 0202', 'avanzada', true),
  ('10000000-0000-0000-0000-00000000000c', null,                                   'Carla Gómez', 'carla.gomez@ecoflow.co','+57 312 555 0303', 'basica',   false);

insert into public.materiales (id, nombre, sku, unidad, costo_unitario, stock) values
  ('20000000-0000-0000-0000-000000000001', 'Panel monocristalino 550 W', 'PNL-550M',  'unidad', 780000,  420),
  ('20000000-0000-0000-0000-000000000002', 'Inversor híbrido 10 kW',     'INV-10KH',  'unidad', 6900000, 35),
  ('20000000-0000-0000-0000-000000000003', 'Estructura de aluminio',     'EST-AL-01', 'metro',  95000,   1200),
  ('20000000-0000-0000-0000-000000000004', 'Cable solar 6 mm²',          'CBL-6MM',   'metro',  7800,    5000);

insert into public.proyectos (id, nombre, cliente, ciudad, direccion, capacidad_kw, estado, fecha_inicio, fecha_fin_estimada, instalador_id) values
  ('30000000-0000-0000-0000-000000000001', 'Techo solar bodega norte',   'Logística Andina S.A.S.', 'Bogotá',       'Cl 80 #68-20',  120.00, 'en_progreso', '2026-10-20', '2026-11-30', '10000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000002', 'Granja solar El Llano',      'Agro Meta Ltda.',         'Villavicencio','Km 12 vía Acacías', 850.00, 'pendiente',   '2026-12-01', '2027-03-15', '10000000-0000-0000-0000-00000000000b'),
  ('30000000-0000-0000-0000-000000000003', 'Colegio San Martín',         'Fundación Educar',        'Medellín',     'Cra 45 #10-33',  45.50, 'completado',  '2026-08-01', '2026-09-10', '10000000-0000-0000-0000-00000000000a'),
  ('30000000-0000-0000-0000-000000000004', 'Clínica Costa Azul',         'Salud Caribe S.A.',       'Barranquilla', 'Cl 76 #54-11',  210.00, 'pendiente',   '2026-12-10', '2027-01-30', null);

insert into public.proyecto_materiales (proyecto_id, material_id, cantidad) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 220),
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 12),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 84),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 160);
