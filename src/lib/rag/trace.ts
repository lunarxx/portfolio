// where traces go: a JSONL file (one call a line, easy to grep and to diff between runs), a Postgres table, or memory
import { appendFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Trace } from './types.ts'
import type { Db } from './stores/postgres.ts'

export type Sink = (t: Trace) => void

export function jsonl(file: string): Sink {
  let ready: Promise<unknown> | null = null
  return (t) => { ready ||= mkdir(dirname(file), { recursive: true }); ready.then(() => appendFile(file, JSON.stringify(t) + '\n')).catch(() => {}) }
}

export function postgres(db: Db, table = 'rag_traces'): Sink {
  const ready = db.query(`create table if not exists ${table} (id text primary key, at timestamptz not null, op text not null, query text, data jsonb not null)`)
  return (t) => { ready.then(() => db.query(`insert into ${table} (id, at, op, query, data) values ($1,$2,$3,$4,$5) on conflict (id) do nothing`, [t.id, t.at, t.op, t.query ?? null, JSON.stringify(t)])).catch(() => {}) }
}

export function collect(): Sink & { all: Trace[] } { const all: Trace[] = []; const s = ((t: Trace) => { all.push(t) }) as Sink & { all: Trace[] }; s.all = all; return s }
