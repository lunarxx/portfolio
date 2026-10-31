// the shapes everything passes around

/** A thing to index: a document, a record, a message. `scope` is a path (tenant:x/contact:y/session:z); `at` its date. */
export interface Doc {
  id: string
  text: string
  title?: string
  scope?: string
  kind?: string
  source?: string
  at?: string
  meta?: Record<string, unknown>
}

/** A piece of a document, as indexed. `context` is the title and heading trail, prepended for search. */
export interface Chunk {
  id: string
  docId: string
  text: string
  context: string
  scope: string
  kind: string
  source: string
  at: string | null
  pos: number
  meta: Record<string, unknown>
  /** memory facts: when it was true, and when we stopped believing it (null: still current) */
  validFrom?: string | null
  validUntil?: string | null
  retiredAt?: string | null
  supersedes?: string | null
  subject?: string | null
  importance?: number
}

/** One search result, with every score that got it there (for traces and evals). */
export interface Hit {
  chunk: Chunk
  score: number
  scores: { keyword?: number; vector?: number; fused?: number; rerank?: number; recency?: number; final?: number }
  ranks: { keyword?: number; vector?: number }
}

export interface Embedder {
  id: string
  dims: number
  /** 'doc' for what's stored, 'query' for what's asked (models embed them differently) */
  embed(texts: string[], as: 'doc' | 'query'): Promise<number[][]>
}

export interface Reranker {
  id: string
  /** a relevance score per passage for the query, 0..1 */
  score(query: string, passages: string[]): Promise<number[]>
}

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
export interface LLM {
  id: string
  /** a JSON object back, or throws */
  json<T = unknown>(messages: ChatMessage[], o?: { maxTokens?: number; temperature?: number }): Promise<T>
}

/** What a store can be asked: a filter applied inside the query, never after. */
export interface Filter {
  /** visible scopes: a chunk is seen when its scope is one of these or above one of them (or below, with `below`) */
  scopes?: string[]
  below?: boolean
  kinds?: string[]
  /** memory: also see retired facts, or the facts as they stood at a moment */
  history?: boolean
  asOf?: string
  /** only chunks dated inside this window (a question that names a time: "last week") */
  at?: { from?: string; to?: string }
  /** in-process stores only (a function can't go into SQL) */
  where?: (c: Chunk) => boolean
}

export interface Store {
  upsert(chunks: Chunk[], vectors: number[][]): Promise<void>
  patch(id: string, p: Partial<Chunk>): Promise<void>
  remove(ids: string[]): Promise<void>
  get(ids: string[]): Promise<Chunk[]>
  /** a document's chunks in order (to see if it changed, and to replace it) */
  listDoc(docId: string): Promise<Chunk[]>
  /** the chunks `n` either side of a position in a document (small to find, big to read) */
  around(docId: string, pos: number, n: number): Promise<Chunk[]>
  keyword(query: string, k: number, f: Filter): Promise<{ chunk: Chunk; score: number }[]>
  vector(v: number[], k: number, f: Filter): Promise<{ chunk: Chunk; score: number }[]>
  count(f?: Filter): Promise<number>
}

export interface Trace {
  id: string
  at: string
  op: 'search' | 'answer' | 'remember'
  query?: string
  rewrites?: string[]
  scope?: string[]
  candidates?: { id: string; source: string; scores: Hit['scores']; ranks: Hit['ranks'] }[]
  kept?: string[]
  answer?: string
  citations?: string[]
  abstained?: boolean
  memory?: { action: string; fact: string; id?: string; replaces?: string }[]
  ms: Record<string, number>
  error?: string
}
