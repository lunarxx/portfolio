// the old landing page, archived 6 Nov 2026 (his call): the call at / is the homepage. outside src/app, so it has no route;
// its components stay in src/components. to bring it back, move this file to src/app/<route>/page.tsx
import { Hero } from '@/components/Hero/Hero'
import { MooneySection } from '@/components/Mooney/MooneySection'
import { WhoFitsSection } from '@/components/WhoFits/WhoFitsSection'
import { AarttsiiSection } from '@/components/Aarttsii/AarttsiiSection'
import { InklingSection } from '@/components/Inkling/InklingSection'
import { SkillsSection } from '@/components/Skills/SkillsSection'
import { TimelineSection } from '@/components/Timeline/TimelineSection'
import { Footer } from '@/components/Footer/Footer'

export default function Home() {
  return (
    <main>
      <Hero />
      <MooneySection />
      <InklingSection />
      <WhoFitsSection />
      <AarttsiiSection />
      <SkillsSection />
      <TimelineSection />
      <Footer />
    </main>
  )
}
