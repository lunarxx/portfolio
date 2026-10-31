// the Postgres store (the desk's shape: Supabase, plain Postgres, PGlite in tests). pgvector with an HNSW index for
// meaning, a generated tsvector with GIN for words (what Supabase's and R2R's hybrid search do), scope and time filters
// in the WHERE, so nothing outside a caller's walls is ever read. `db` is anything with query(sql, params) → { rows }:
// node-postgres's Pool or a PGlite instance
import type { Chunk, Filter, Store } from '../types.ts'
import { above } from '../scope.ts'

export interface Db { query(sql: string, params?: unknown[]): Promise<{ rows: any[] }> }

const STOP = new Set('a an and are as at be but by can could did do does for from had has have how i if in into is it its me my no not of on or our so that the their them then there these they this to too us was we were what when where which who why will with would you your'.split(' '))

export class PgStore implements Store {
  private db: Db; private table: string; private dims: number
  constructor(db: Db, table = 'rag_chunks', dims = 768) { this.db = db; this.table = table; this.dims = dims }

  /** tables and indexes, idempotent */
  async init() {
    const t = this.table
    for (const sql of [
      `create extension if not exists vector`,
      `create table if not exists ${t} (
        id text primary key, doc_id text not null, text text not null, context text not null default '',
        scope text not null default 'global', kind text not null default 'doc', source text not null default '',
        at timestamptz, pos bigint not null default 0, meta jsonb not null default '{}',
        valid_from timestamptz, valid_until timestamptz, retired_at timestamptz, supersedes text, subject text, importance real,
        embedding vector(${this.dims}),
        fts tsvector generated always as (to_tsvector('english', context || ' ' || text)) stored)`,
      `create index if not exists ${t}_fts on ${t} using gin (fts)`,
      `create index if not exists ${t}_vec on ${t} using hnsw (embedding vector_cosine_ops)`,
      `create index if not exists ${t}_scope on ${t} (scope, kind)`,
      `create index if not exists ${t}_doc on ${t} (doc_id, pos)`,
    ]) await this.db.query(sql)
  }

  private row = (r: any): Chunk => ({
    id: r.id, docId: r.doc_id, text: r.text, context: r.context, scope: r.scope, kind: r.kind, source: r.source,
    at: r.at ? new Date(r.at).toISOString() : null, pos: Number(r.pos), meta: r.meta || {},
    validFrom: r.valid_from ? new Date(r.valid_from).toISOString() : null, validUntil: r.valid_until ? new Date(r.valid_until).toISOString() : null,
    retiredAt: r.retired_at ? new Date(r.retired_at).toISOString() : null, supersedes: r.supersedes, subject: r.subject, importance: r.importance ?? undefined,
  })
  private cols = 'id, doc_id, text, context, scope, kind, source, at, pos, meta, valid_from, valid_until, retired_at, supersedes, subject, importance'

  /** the filter as SQL, its parameters numbered from `start` */
  private where(f: Filter, start: number): { sql: string; params: unknown[] } {
    const w: string[] = [], p: unknown[] = []
    const add = (cond: (i: number) => string, v: unknown) => { p.push(v); w.push(cond(start + p.length - 1)) }
    if (f.scopes?.length) {
      const up = [...new Set(f.scopes.flatMap(above))]
      p.push(up); const i = start + p.length - 1
      if (f.below) { p.push(f.scopes.map((s) => s + '/%')); w.push(`(scope = any($${i}) or scope like any($${i + 1}))`) }
      else w.push(`scope = any($${i})`)
    }
    if (f.kinds?.length) add((i) => `kind = any($${i})`, f.kinds)
    if (!f.history) {
      if (f.asOf) add((i) => `(valid_from is null or valid_from <= $${i}) and (valid_until is null or valid_until > $${i})`, f.asOf)
      else w.push(`retired_at is null and (valid_until is null or valid_until > now())`)
    }
    if (f.at?.from) add((i) => `(at is null or at >= $${i})`, f.at.from)
    if (f.at?.to) add((i) => `(at is null or at <= $${i})`, f.at.to)
    return { sql: w.length ? w.join(' and ') : 'true', params: p }
  }

  async upsert(chunks: Chunk[], vectors: number[][]) {
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i], v = vectors[i]
      await this.db.query(
        `insert into ${this.table} (${this.cols}, embedding) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         on conflict (id) do update set doc_id=excluded.doc_id, text=excluded.text, context=excluded.context, scope=excluded.scope, kind=excluded.kind,
         source=excluded.source, at=excluded.at, pos=excluded.pos, meta=excluded.meta, valid_from=excluded.valid_from, valid_until=excluded.valid_until,
         retired_at=excluded.retired_at, supersedes=excluded.supersedes, subject=excluded.subject, importance=excluded.importance, embedding=excluded.embedding`,
        [c.id, c.docId, c.text, c.context, c.scope, c.kind, c.source, c.at, c.pos, JSON.stringify(c.meta || {}), c.validFrom ?? null, c.validUntil ?? null,
          c.retiredAt ?? null, c.supersedes ?? null, c.subject ?? null, c.importance ?? null, v?.length ? `[${v.join(',')}]` : null])
    }
  }
  async patch(id: string, p: Partial<Chunk>) {
    const map: Record<string, string> = { text: 'text', context: 'context', scope: 'scope', kind: 'kind', validFrom: 'valid_from', validUntil: 'valid_until', retiredAt: 'retired_at', supersedes: 'supersedes', subject: 'subject', importance: 'importance', at: 'at' }
    const sets: string[] = [], params: unknown[] = [id]
    for (const [k, col] of Object.entries(map)) if (k in p) { params.push((p as any)[k] ?? null); sets.push(`${col} = $${params.length}`) }
    if (p.meta) { params.push(JSON.stringify(p.meta)); sets.push(`meta = meta || $${params.length}::jsonb`) }
    if (sets.length) await this.db.query(`update ${this.table} set ${sets.join(', ')} where id = $1`, params)
  }
  async remove(ids: string[]) { if (ids.length) await this.db.query(`delete from ${this.table} where id = any($1)`, [ids]) }
  async get(ids: string[]) {
    if (!ids.length) return []
    const { rows } = await this.db.query(`select ${this.cols} from ${this.table} where id = any($1)`, [ids])
    const by = new Map(rows.map((r) => [r.id, this.row(r)])); return ids.map((id) => by.get(id)).filter(Boolean) as Chunk[]
  }
  async listDoc(docId: string) { return (await this.db.query(`select ${this.cols} from ${this.table} where doc_id = $1 order by pos`, [docId])).rows.map(this.row) }
  async around(docId: string, pos: number, n: number) {
    return (await this.db.query(`select ${this.cols} from ${this.table} where doc_id = $1 and pos between $2 and $3 order by pos`, [docId, pos - n, pos + n])).rows.map(this.row)
  }
  // words: any of the question's words (OR), ranked by ts_rank_cd; Postgres stems them itself ('english')
  async keyword(query: string, k: number, f: Filter) {
    const words = [...new Set((query.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => !STOP.has(w) && w.length > 1))]
    if (!words.length) return []
    const wh = this.where(f, 3)
    const { rows } = await this.db.query(
      `select ${this.cols}, ts_rank_cd(fts, q) as score from ${this.table}, to_tsquery('english', $1) q where fts @@ q and ${wh.sql} order by score desc limit $2`,
      [words.join(' | '), k, ...wh.params])
    return rows.filter((r) => !f.where || f.where(this.row(r))).map((r) => ({ chunk: this.row(r), score: Number(r.score) }))
  }
  async vector(v: number[], k: number, f: Filter) {
    const wh = this.where(f, 3)
    const { rows } = await this.db.query(
      `select ${this.cols}, 1 - (embedding <=> $1) as score from ${this.table} where embedding is not null and ${wh.sql} order by embedding <=> $1 limit $2`,
      [`[${v.join(',')}]`, k, ...wh.params])
    return rows.filter((r) => !f.where || f.where(this.row(r))).map((r) => ({ chunk: this.row(r), score: Number(r.score) }))
  }
  async count(f: Filter = {}) {
    const wh = this.where(f, 1)
    return Number((await this.db.query(`select count(*)::int as n from ${this.table} where ${wh.sql}`, wh.params)).rows[0].n)
  }
}
