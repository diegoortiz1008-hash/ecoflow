-- Introspección del esquema public en JSON (columnas de tablas/vistas y enums)
select json_build_object(
  'columns', (
    select json_agg(json_build_object(
      'table', c.relname,
      'kind', c.relkind,
      'column', a.attname,
      'udt', t.typname,
      'nullable', case when c.relkind = 'v' then true else not a.attnotnull end,
      'has_default', a.atthasdef
    ) order by c.relname, a.attnum)
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_type t on t.oid = a.atttypid
    where n.nspname = 'public' and c.relkind in ('r', 'v') and a.attnum > 0 and not a.attisdropped
  ),
  'enums', (
    select json_object_agg(typname, labels)
    from (
      select t.typname, json_agg(e.enumlabel order by e.enumsortorder) as labels
      from pg_type t
      join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      group by t.typname
    ) x
  )
);
