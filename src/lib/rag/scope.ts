// who sees what. a scope is a path, `tenant:aarttsii/contact:123/session:9`; a search from a scope sees chunks in it and
// in everything above it (`global`, `tenant:aarttsii`, `tenant:aarttsii/contact:123`), never a sibling's. with `below`
// it also sees what's under it (a tenant-wide search across all its contacts). time: facts are current unless asked
// for the past (`asOf`) or everything (`history`)
import type { Chunk, Filter } from './types.ts'

/** a scope and every scope above it, `global` first */
export function above(scope: string): string[] {
  const parts = scope.split('/').filter(Boolean), out = ['global']
  for (let i = 1; i <= parts.length; i++) out.push(parts.slice(0, i).join('/'))
  return [...new Set(out)]
}

export function visible(c: Chunk, f: Filter, now = new Date().toISOString()): boolean {
  if (f.scopes?.length) {
    const ok = f.scopes.some((s) => above(s).includes(c.scope) || (f.below && c.scope.startsWith(s + '/')))
    if (!ok) return false
  }
  if (f.kinds?.length && !f.kinds.includes(c.kind)) return false
  if (!f.history) {
    if (f.asOf) {
      if (c.validFrom && c.validFrom > f.asOf) return false
      if (c.validUntil && c.validUntil <= f.asOf) return false
    } else {
      if (c.retiredAt) return false
      if (c.validUntil && c.validUntil <= now) return false
    }
  }
  if (f.at && c.at) {
    if (f.at.from && c.at < f.at.from) return false
    if (f.at.to && c.at > f.at.to) return false
  }
  if (f.where && !f.where(c)) return false
  return true
}
