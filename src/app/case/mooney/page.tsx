import Link from 'next/link'

export default function MooneyCaseStudy() {
  return (
    <article style={{ maxWidth: 800, margin: '0 auto', padding: '80px 40px', color: '#1A1A1A', background: '#F2EFE7', minHeight: '100vh' }}>
      <Link href="/" style={{ fontSize: '0.82rem', color: '#9E9A94' }}>← back</Link>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 600, marginTop: 32, letterSpacing: '-0.03em' }}>
        mooney: the expense tracker that listens
      </h1>
      <p style={{ color: '#9E9A94', marginTop: 8 }}>voice first. zero typing. real users.</p>

      <section style={{ marginTop: 48, lineHeight: 1.8, fontSize: '1rem', color: '#3a3a3a' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 12 }}>the problem</h2>
        <p>logging expenses requires too many taps. you open an app, pick a category, type an amount, maybe add a note. most people give up after a week. mooney lets you hold a button, say &ldquo;300 rupees uber&rdquo;, and the expense is saved in under 2 seconds.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12 }}>the magic</h2>
        <p>the voice pipeline is the core. your audio goes to deepgram nova-3 for transcription, then to groq&apos;s llama 8b for intent parsing. if the 8b model can&apos;t figure out what you said, it falls back to the 70b model. if that fails, cerebras. if that fails, openrouter&apos;s free tier. four providers deep. it never fully breaks.</p>
        <p style={{ marginTop: 12 }}>deepgram misrecognizes &ldquo;20 rupees&rdquo; as &ldquo;20 arrests&rdquo;. ml kit reads the ₹ symbol as Z, T, H, A, or F. these are real problems i had to solve with regex post-processing and keyword boosting.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12 }}>the architecture</h2>
        <p>flutter app with two android processes — the main app and an overlay process. the overlay lets you log expenses from a home screen widget without opening the app. but here&apos;s the catch: the overlay can&apos;t access hive (the local DB), supabase, or the main dart VM. all communication happens through a json bridge file on disk.</p>
        <p style={{ marginTop: 12 }}>10 supabase edge functions handle everything serverside: stt, llm parsing, receipt ocr, push notifications, cloud backup, monthly email reports, bill splitting.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12 }}>receipt scanning</h2>
        <p>three-tier vision pipeline. on-device ml kit for free users (with extensive regex to fix ₹ misreads). groq scout vision model for paid users. gemini flash as the final fallback. the system detects columns in receipts using bounding box Y-grouping to avoid mixing up item names and prices.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12 }}>where it stands</h2>
        <p>19 beta testers on android. closed testing. 60+ countries supported with per-country STT language codes, LLM prompt rules, and OCR prompts. reverse trial model — all paid features available for 7 days from install.</p>

        <div style={{ marginTop: 48, padding: 24, background: '#FFFFFF', borderRadius: 12, border: '1px dashed #CEC9BF' }}>
          <p style={{ fontSize: '0.85rem', color: '#9E9A94', fontStyle: 'italic' }}>space reserved for sanshu LOR and additional credentials</p>
        </div>
      </section>
    </article>
  )
}
