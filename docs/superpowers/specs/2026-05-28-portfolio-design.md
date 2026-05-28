# Portfolio Design Spec

## Overview

Interactive portfolio for Ashwini Tiwari targeting startup founders/CTOs for product engineer / AI application engineer roles. The portfolio's core principle: **visitors experience the products, not read about them.** Each major project has a live or mocked interactive demo as its centerpiece, with expandable architecture deep-dives underneath.

Design identity is its own thing — not borrowed from any single project. Aesthetic: sleek, cutesy, raw. No corporate vibes, no generic AI aesthetics. 3D characters from Ashwini's art era (Sanshu, ArtStation work) appear throughout as visual identity.

## Target Audience

Startup founders and CTOs hiring for product/AI engineer roles. The portfolio should make Ashwini speak less in interviews — the site does the talking.

## Tech Stack

- Next.js (App Router) on Vercel
- No UI framework decided yet — will determine during implementation

## Structure

### 1. Hero

- Name: Ashwini Tiwari
- Short honest positioning line (copy TBD — no exaggeration, no "zero to users" claims)
- 3D characters subtly present in background/corners
- Entry point into project sections below
- Lightweight — gets out of the way fast

### 2. Project: Mooney

**Interactive demo (real APIs):**
- Mic button prompt: "Try logging an expense"
- Visitor speaks → Deepgram STT transcribes → Groq LLM parses intent (amount, category, merchant) → receipt-themed card animates in with parsed result
- Mini insight generates based on the expense
- Mooney's cow mascot present, animated, reacts to voice input
- Rate limited to prevent abuse

**Expandable deep-dive:**
- Interactive system diagram: multi-provider AI fallback chain (Deepgram → Groq 8b → Groq 70b → Cerebras → OpenRouter)
- Click any node to see what it does and why
- Stats: "19 beta testers", "voice-to-data in <2s", "60+ countries supported"

**What it communicates:** "This person built a working voice-to-structured-data AI pipeline. I just used it."

### 3. Project: WhoFits

**Interactive demo (fully mocked, zero API cost):**
- Two floating containers side by side
- Left: 5-10 seed creator cards (profile pic, handle, bio snippet, follower count)
- Right: empty qualification dashboard
- Hand-drawn curvy arrow (line-line-line style, organic) pointing from creators → empty dashboard, stimulating drag-and-drop
- Drag a creator card into the dashboard → pre-computed qualification data slides in instantly (brand safety score, niche classification, engagement quality, network position, overall score)
- All data is hardcoded JSON mapped to each seed creator
- WhoFits character present in section

**Expandable deep-dive:**
- Explorable architecture diagram: CSV seeds → TwitterAPI.io ingestion → brand classification → Playwright reply extraction → network edges → Grok qualification → SBERT embeddings → PageRank/Louvain clustering → Discovery API ranking
- Show it as the designed architecture (don't call out what's wired vs not)

**What it communicates:** "This person thinks at the system level — crawlers, APIs, ML pipelines, network analysis."

### 4. Project: aarttsii

**Interactive demo (mocked + real API hybrid):**
- 3-4 pre-loaded crochet reference images as selectable cards
- Pick one → instant estimate appears (hardcoded): complexity index, yarn tier, size, price range, detected details breakdown
- "Try your own" option: upload any image → hits real Groq vision API → real estimate returned
- Real API path is rate limited
- aarttsii character/visual identity present

**Story it tells:** DM bargaining replaced by AI-powered instant commission pricing.

**Expandable deep-dive:**
- How the Groq vision pipeline analyzes images
- Commission flow: image → analysis → estimate → customer contact → order
- Connection to admin dashboard

**What it communicates:** "This person identified a real UX problem (DM bargaining) and solved it with AI."

### 5. Internal Tools

**Visible and showable now:**
- **TweetBrain** — signal-based personality engine for Twitter growth. Show as internal tooling: signal extraction from conversations → topic weighting with time decay → layered generation → anti-slop filtering → tweet output. Mini demo TBD.
- **aarttsii scraper** — Reddit/Twitter scraper for crochet community outreach. Show as internal tooling powering aarttsii's customer discovery.

**Built in code but hidden until ready:**
- Blue collar portfolio dashboards for WhoFits agency

**What it communicates:** "I don't just build products, I build the automation that feeds them."

### 6. Interactive Timeline

Horizontal scrollable strip showing career evolution:

- **2020-2023:** Sanshu Studios — Lead 3D artist. Yokai NFT collection (2,000 NFTs, 8 animated artworks, Phase 1 sold out in 3 days). Part of crypto's first decentralized design studio.
- **2023-2024:** media3ms — 3D marketing agency. Personalized 3D mascot animations for brands.
- **Late 2025-present:** AI + product engineering. Built Mooney, aarttsii, WhoFits, internal tooling.

Each node has a visual from that era (3D renders, screenshots, icons). No mention of streamer montages / 3ManSquad. Narrative: creative → technical → product builder — iterations, not failures.

### 7. Footer

GitHub, Twitter/X, LinkedIn, email. Clean, minimal.

## Design Principles

1. **Interactive first, text second** — every project leads with something you DO, not something you read
2. **Lightweight by default, expandable on demand** — project sections start compact, architecture/details are behind expand interactions
3. **Exaggerate presentation, not facts** — make real things feel impressive through UX and polish, never claim things that aren't true
4. **Characters everywhere** — 3D characters from Sanshu/ArtStation era tie the visual identity together across sections
5. **No corporate/AI aesthetic** — no gradient orbs, no particle backgrounds, no "passionate developer" copy
6. **Hackathon energy** — the demos should make people go "wait, this actually works?"

## What's NOT on the portfolio

- No 3ManSquad / streamer montage history
- No ImageToPattern
- No SourceCheck
- No Yahoo Finance / paid PR claims
- No unverifiable numbers ($500k etc.)
- No "zero to users" or similar exaggerated positioning
