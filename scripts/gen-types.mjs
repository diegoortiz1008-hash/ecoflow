// Genera src/types/database.types.ts introspeccionando PostgreSQL (equivalente local a
// `npx supabase gen types typescript`). Uso:
//   psql ... -At -f scripts/introspect.sql > tmp.json && node scripts/gen-types.mjs tmp.json
import { readFileSync, writeFileSync } from 'node:fs'

const { columns, enums } = JSON.parse(readFileSync(process.argv[2], 'utf8'))

const PG_TO_TS = {
  uuid: 'string', text: 'string', varchar: 'string', date: 'string', timestamptz: 'string',
  timestamp: 'string', bool: 'boolean', int2: 'number', int4: 'number', int8: 'number',
  float4: 'number', float8: 'number', numeric: 'number', json: 'Json', jsonb: 'Json',
}

const enumNames = new Set(Object.keys(enums))
const tsType = (c) => {
  const base = enumNames.has(c.udt) ? `Database['public']['Enums']['${c.udt}']` : PG_TO_TS[c.udt] ?? 'unknown'
  return c.nullable ? `${base} | null` : base
}

const relations = new Map()
for (const c of columns) {
  if (!relations.has(c.table)) relations.set(c.table, { kind: c.kind, cols: [] })
  relations.get(c.table).cols.push(c)
}

const block = (cols, mode) =>
  cols
    .map((c) => {
      const optional = mode === 'Update' || (mode === 'Insert' && (c.nullable || c.has_default))
      return `          ${c.column}${optional ? '?' : ''}: ${tsType(c)}`
    })
    .join('\n')

let tables = ''
let views = ''
for (const [name, { kind, cols }] of relations) {
  if (kind === 'v') {
    views += `      ${name}: {\n        Row: {\n${block(cols, 'Row')}\n        }\n        Relationships: []\n      }\n`
  } else {
    tables += `      ${name}: {\n        Row: {\n${block(cols, 'Row')}\n        }\n        Insert: {\n${block(cols, 'Insert')}\n        }\n        Update: {\n${block(cols, 'Update')}\n        }\n        Relationships: []\n      }\n`
  }
}

const enumBlock = Object.entries(enums)
  .map(([n, values]) => `      ${n}: ${values.map((v) => `'${v}'`).join(' | ')}`)
  .join('\n')

const out = `// ⚠️ ARCHIVO GENERADO por scripts/gen-types.mjs a partir del esquema real de PostgreSQL.
// No editar a mano: regenerar con \`npm run gen:types\` (o \`npx supabase gen types typescript --linked\`).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
${tables}    }
    Views: {
${views}    }
    Functions: {
      is_coordinador: { Args: Record<PropertyKey, never>; Returns: boolean }
      mi_instalador_id: { Args: Record<PropertyKey, never>; Returns: string }
    }
    Enums: {
${enumBlock}
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database['public']
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
export type Views<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row']
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]
`
writeFileSync('src/types/database.types.ts', out)
console.log(`Tipos generados: ${relations.size} relaciones, ${enumNames.size} enums -> src/types/database.types.ts`)
