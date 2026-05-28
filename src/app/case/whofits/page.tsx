import Link from 'next/link'

export default function WhoFitsCaseStudy() {
  return (
    <article style={{ maxWidth: 800, margin: '0 auto', padding: '80px 40px', color: '#F9F8F6', background: '#12100e', minHeight: '100vh' }}>
      <Link href="/" style={{ fontSize: '0.82rem', color: '#8a8078' }}>← back</Link>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 600, marginTop: 32, letterSpacing: '-0.03em' }}>
        whofits: finding creators worth working with
      </h1>
      <p style={{ color: '#8a8078', marginTop: 8 }}>network-aware creator qualification for influencer marketing agencies.</p>

      <section style={{ marginTop: 48, lineHeight: 1.8, fontSize: '1rem', color: '#b5ada5' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 12, color: '#F9F8F6' }}>the problem</h2>
        <p>influencer marketing agencies discover creators by manually scrolling their X feed for days. no structured way to find, vet, or defend creator selections to clients. they check profiles one by one and record findings in spreadsheets.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12, color: '#F9F8F6' }}>the insight</h2>
        <p>follower count is a vanity metric. you can buy 50k followers overnight. what you can&apos;t fake is being embedded in a creator ecosystem — who replies to you, who engages with your content, where you sit in the network graph. whofits ranks creators by network position, not just numbers.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12, color: '#F9F8F6' }}>the crawler</h2>
        <p>25,000+ creators crawled. the pipeline: CSV seeds → twitterapi.io batch ingestion at $0.004 per profile → brand classification (60% ollama LLM, 40% heuristic) → playwright browser crawling for reply threads (the one thing without an API). quality gate: ollama qwen3 scoring each reply on text quality, sentiment, and engagement.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12, color: '#F9F8F6' }}>two-layer qualification</h2>
        <p>layer 1 is instant: stored profile data for free pre-filtering. layer 2 triggers a grok-powered deep analysis that returns a qualification card with top 3 reasons, evidence posts with URLs, integrity flags, and a qualified/monitor/reject verdict. all auditable and reproducible.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12, color: '#F9F8F6' }}>the architecture</h2>
        <p>pnpm monorepo with turborepo. next.js 16 app router. 2,618-line technical plan with locked formulas: evidence scoring with 14-day recency decay, per-post caps, evidence-weighted embedding pooling (bio 15%, posts 85%), HNSW vector index, pagerank per niche, louvain clustering, 7-signal ranking formula.</p>
        <p style={{ marginTop: 12 }}>immutable raw blobs, model versioning on every derived field, append-only audit log. the system is designed so every qualification decision can be traced back to the evidence that produced it.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12, color: '#F9F8F6' }}>where it stands</h2>
        <p>crawler pipeline built and running. qualification engine designed with locked formulas. marketing website shipped with 3D character models. full mock dashboard (50+ components). qualification ships before discovery — agencies bring their own creator lists first.</p>
      </section>
    </article>
  )
}
