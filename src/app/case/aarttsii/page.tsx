import Link from 'next/link'

export default function AarttsiiCaseStudy() {
  return (
    <article style={{ maxWidth: 800, margin: '0 auto', padding: '80px 40px', color: '#2C2416', background: '#EDE8DF', minHeight: '100vh' }}>
      <Link href="/" style={{ fontSize: '0.82rem', color: '#7A6E62' }}>← back</Link>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 600, marginTop: 32, letterSpacing: '-0.03em' }}>
        aarttsii: pricing crochet without the guesswork
      </h1>
      <p style={{ color: '#7A6E62', marginTop: 8 }}>ai-powered commission pricing for handmade crochet.</p>

      <section style={{ marginTop: 48, lineHeight: 1.8, fontSize: '1rem', color: '#4a4035' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 12 }}>the problem</h2>
        <p>handmade crochet has no fair pricing. buyers can&apos;t tell what goes into a piece. artists underprice their labor because they don&apos;t know how to quantify complexity. every commission starts with &ldquo;how much for this?&rdquo; in instagram DMs, followed by awkward back-and-forth haggling.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12 }}>the solution</h2>
        <p>upload any image — a pet photo, a pinterest screenshot, a cartoon character — and the ai estimator instantly scores its crochet complexity on 8 weighted axes, detects construction details, classifies wearable vs amigurumi, and returns a transparent price breakdown. no DM required.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12 }}>the vision pipeline</h2>
        <p>groq&apos;s llama 4 scout vision model analyzes the image. 3 specialized prompts: category detection (wearable vs amigurumi vs reference image), complexity scoring (8 axes: part count 30%, surface detail 15%, scale 13%, color 12%, shape 10%, wire 8%, miniatures 7%, texture 5%), and wearable-specific scoring for garments.</p>
        <p style={{ marginTop: 12 }}>the hardest part: teaching an LLM to count crochet parts. a basic bear is 10 separate pieces (body, head, 4 limbs, 2 ears, tail, muzzle). a dragon is 15-20. a sunflower bouquet has 22 individual petals. and granny square bags keep getting misclassified as crop tops.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12 }}>pricing engine</h2>
        <p>power curve (CI^0.65) mapped to category-specific price bands per yarn tier (mousse and chenille only — cotton only for wearables). detail surcharges by impact level. international multiplier for overseas orders. prices range from ₹250 for a mini mousse piece to ₹12,000 for a cotton blanket.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12 }}>the full stack</h2>
        <p>next.js app router with supabase backend. razorpay payments. full admin dashboard with orders, commissions, products CRUD, reviews. the design uses asymmetric border radius (2px 4px 3px 2px) for a handmade feel. instrument serif for display, karla for body. paper-grain texture overlay.</p>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 40, marginBottom: 12 }}>where it stands</h2>
        <p>live e-commerce site. admin dashboard operational. commission estimator powered by groq vision. ₹220-250/hr labor rates built into pricing. 2-week delivery standard.</p>
      </section>
    </article>
  )
}
