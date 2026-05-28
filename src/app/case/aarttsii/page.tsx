import Link from 'next/link'
import styles from '../case.module.css'

export default function AarttsiiCaseStudy() {
  return (
    <article className={styles.page} style={{
      '--case-fg': '#2C2416',
      '--case-body': '#4a4035',
      '--case-muted': '#7A6E62',
      '--case-accent': '#B5704A',
      '--case-callout': 'rgba(181, 112, 74, 0.08)',
      '--case-border': '#D6CFC4',
      background: '#EDE8DF',
    } as React.CSSProperties}>
      <Link href="/" className={styles.back}>back</Link>

      <div className={styles.hero}>
        <h1 className={styles.title}>pricing crochet without the guesswork</h1>
        <p className={styles.subtitle}>
          aarttsii is a crochet e-commerce site where customers upload a photo and get a transparent price breakdown instead of haggling in DMs.
        </p>
        <div className={styles.meta}>
          <div className={styles.metaItem}>role<strong>solo built</strong></div>
          <div className={styles.metaItem}>stack<strong>next.js, supabase, groq vision</strong></div>
          <div className={styles.metaItem}>status<strong>live</strong></div>
          <div className={styles.metaItem}>site<strong>aarttsii.com</strong></div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <p className={styles.sectionLabel}>the problem</p>
          <h2 className={styles.sectionTitle}>nobody knows what crochet should cost</h2>
          <p className={styles.body}>
            handmade crochet has no pricing standard. buyers have no idea what goes into a piece. artists consistently underprice their work because they don&apos;t know how to quantify the labor. every commission starts with &ldquo;how much for this?&rdquo; in instagram DMs, followed by awkward back and forth where both sides feel weird about money.
          </p>
          <div className={styles.callout}>
            i watched a friend who crochets spend 20 minutes trying to explain to a customer why a bear costs what it costs. she charged a fair price but couldn&apos;t break it down. the customer left feeling unsure. that&apos;s the gap. not the pricing itself, but the transparency around it.
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>the solution</p>
          <h2 className={styles.sectionTitle}>upload a photo, get a real price</h2>
          <p className={styles.body}>
            upload any image. a pet photo, a pinterest screenshot, a cartoon character. the ai estimator scores its crochet complexity across 8 weighted axes, figures out what kind of piece it would be (amigurumi vs wearable vs accessory), and returns a full price breakdown showing materials, labor hours, and total estimate range.
          </p>
          <p className={styles.body}>
            no DM required. no guessing. the customer sees exactly why a dragon costs more than a bear (more parts, more detail, more hours).
          </p>
        </div>

        <hr className={styles.divider} />

        <div className={styles.section}>
          <p className={styles.sectionLabel}>how it works</p>
          <h2 className={styles.sectionTitle}>teaching an AI to count crochet parts</h2>
          <p className={styles.body}>
            groq&apos;s llama 4 scout vision model analyzes the image using 3 specialized prompts: category detection (is this a stuffed animal or a sweater?), complexity scoring across 8 axes, and wearable specific scoring for garments.
          </p>
          <div className={styles.grid}>
            <div className={styles.gridCard}><strong>part count (30%)</strong><span>a basic bear is 10 pieces. a dragon is 20.</span></div>
            <div className={styles.gridCard}><strong>surface detail (15%)</strong><span>embroidery, color changes, stitch patterns</span></div>
            <div className={styles.gridCard}><strong>scale (13%)</strong><span>bigger pieces need exponentially more yarn</span></div>
            <div className={styles.gridCard}><strong>color complexity (12%)</strong><span>each color change is a join point</span></div>
            <div className={styles.gridCard}><strong>shape difficulty (10%)</strong><span>organic curves are harder than boxes</span></div>
            <div className={styles.gridCard}><strong>wire armature (8%)</strong><span>poseable pieces need internal structure</span></div>
          </div>
          <div className={styles.callout}>
            the hardest part was teaching an LLM to count parts. a sunflower bouquet has 22 individual petals. granny square bags keep getting misclassified as crop tops. these edge cases are what made this interesting.
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>pricing engine</p>
          <h2 className={styles.sectionTitle}>power curves, not flat rates</h2>
          <p className={styles.body}>
            the complexity index maps to price bands using a power curve (CI^0.65) so pricing feels right at both ends. a simple mini mousse piece starts around 250 rupees. a detailed cotton blanket can hit 12,000. the curve means that going from complexity 3 to 4 adds less than going from 8 to 9, which matches real labor time.
          </p>
          <p className={styles.body}>
            two yarn tiers: mousse (soft, baby safe) and chenille (velvet plush). cotton only shows up for wearables because the detection model catches it. material costs, labor hours at 220 to 250 per hour, and a base rate all get shown in the breakdown. full transparency.
          </p>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>status</p>
          <h2 className={styles.sectionTitle}>live and taking orders</h2>
          <p className={styles.body}>
            fully functional e-commerce site with razorpay payments, admin dashboard for orders and products, and the AI estimator running on groq vision. the design uses asymmetric border radius and paper grain textures because crochet is handmade and the site should feel that way too.
          </p>
        </div>
      </div>
    </article>
  )
}
