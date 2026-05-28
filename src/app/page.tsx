import { Hero } from '@/components/Hero/Hero'
import { MooneySection } from '@/components/Mooney/MooneySection'
import { WhoFitsSection } from '@/components/WhoFits/WhoFitsSection'
import { AarttsiiSection } from '@/components/Aarttsii/AarttsiiSection'
import { SkillsSection } from '@/components/Skills/SkillsSection'
import { TimelineSection } from '@/components/Timeline/TimelineSection'
import { Footer } from '@/components/Footer/Footer'

export default function Home() {
  return (
    <main>
      <Hero />
      <MooneySection />
      <WhoFitsSection />
      <AarttsiiSection />
      <SkillsSection />
      <TimelineSection />
      <Footer />
    </main>
  )
}
