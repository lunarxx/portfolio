// the case studies, as data: one page component reads these (src/app/case/[slug]/page.tsx), and scripts/guard-test.ts runs every
// sentence here through the voice guard. every number traces to his records; aarttsii's results stay aarttsii's, and nothing here
// names a client contact, a price or a setback he didn't choose to tell
export type Section = { label: string; title: string; body: string[]; callout?: string; grid?: [string, string][] }
export type CaseStudy = {
  slug: string; name: string; line: string; title: string; subtitle: string; meta: [string, string][]; href?: [string, string]
  colors: { fg: string; body: string; muted: string; accent: string; callout: string; border: string; bg: string }
  sections: Section[]
}

export const CASES: CaseStudy[] = [
  {
    slug: 'aarttsii', name: 'aarttsii', line: 'How a crochet brand landed Hocco from a cold email.',
    title: 'how a crochet brand landed hocco from a cold email',
    subtitle: 'aarttsii makes crochet by hand. i built all the tech behind it, the store, the ops, the pricing and the outreach that got us in front of brands like hocco.',
    meta: [['role', 'all of the tech, solo'], ['stack', 'next.js, supabase, razorpay'], ['deal', 'hocco, 50 mascots'], ['site', 'aarttsii.com']],
    href: ['aarttsii.com', 'https://aarttsii.com'],
    colors: { fg: '#2C2416', body: '#4a4035', muted: '#7A6E62', accent: '#B5704A', callout: 'rgba(181, 112, 74, 0.08)', border: '#D6CFC4', bg: '#EDE8DF' },
    sections: [
      {
        label: 'the deal', title: 'hocco ordered 50 of their scooperhero mascots in crochet',
        body: [
          'hocco is an indian ice cream brand, and they heard about aarttsii because our outreach wrote to them. there was no agency or intro involved, it was a cold email that turned into samples, then a negotiation, then a purchase order on their vendor system.',
          'they came in well under our quote, and we held the price by naming what the work actually involved, new patterns and their logo on the cape. the order closed above their number and it shipped.',
        ],
        callout: 'this was the proof i wanted from the whole pipeline: someone at a real brand reading an email from a small crochet studio and raising a PO.',
      },
      {
        label: 'the outreach', title: '17 percent of the brands we wrote to wrote back',
        body: [
          '37 of the 212 brands we wrote to replied, and the rate held on both google and outlook inboxes, 17 and 19 percent. on the india list it was 16 of 99, and 15 of those were warm, asking for concepts, pictures or a call. i count replies by scanning the real inboxes, because a flag in a database can be wrong and i wanted to know.',
          'measuring properly changed what we sent. scarcity lines were killing replies, so they went. offering a couple of concepts or a quick call beat offering a call alone, and a domain inbox pulled about 3.3 times what a gmail one did across 458 real sends.',
        ],
        grid: [['17%', '37 of 212 brands replied'], ['16 of 99', 'on the india list, 15 of them warm'], ['9.7% vs 4.7%', 'two ways to say yes against a call only'], ['7.0% vs 1.6%', 'emails without scarcity lines against emails with them'], ['3.3x', 'a domain inbox against gmail, over 458 sends']],
      },
      {
        label: 'the estimator', title: 'a price from a photo',
        body: [
          'nobody knows what crochet should cost, so every commission used to start with an awkward conversation in dms. now you upload a photo and it scores how hard the piece is across 8 axes, then shows making hours, yarn, parts and the total.',
          'i picked the model by testing on her real catalogue. gemma 4 was 13 to 14 percent off on hours and flash lite was 19, so i took the accurate one and lived with it being slower. the same photo always gets the same answer because each result is cached by a fingerprint of the image for 30 days.',
        ],
      },
      {
        label: 'everything else', title: 'the rest of the business runs on it too',
        body: [
          'the store is a pixel house drawn in code, a cross section where a little cat walks you through the rooms. behind it there\'s an ops portal with orders, invoices and a company crm, and courier booking from telegram.',
          'before any of it had a screen i wrote 40,000 words of research on pricing psychology, competitors and how we\'d sell it.',
        ],
      },
    ],
  },
  {
    slug: 'cookie', name: 'Cookie', line: 'A front desk that quotes from real costs and chases the money.',
    title: 'a front desk with her own number',
    subtitle: 'cookie runs the front desk for made-to-order businesses. the owner texts her an order, and she prices it, sends the proposal, collects the advance and chases the balance.',
    meta: [['role', 'solo built'], ['stack', 'typescript, hono, postgres, python'], ['channels', 'whatsapp, instagram, email'], ['status', 'live since 23 oct 2026']],
    colors: { fg: '#16261F', body: '#33453D', muted: '#6A7A72', accent: '#2F6B54', callout: 'rgba(47, 107, 84, 0.08)', border: '#CBD6CF', bg: '#E8EEE9' },
    sections: [
      {
        label: 'the problem', title: 'small makers lose money in the messages',
        body: [
          'if you make things to order, your business lives in chats. quoting takes a while because the costs are in your head, the advance gets forgotten, and the balance turns into three awkward reminders. i built this on aarttsii first because i was watching all of that happen there.',
        ],
      },
      {
        label: 'how she works', title: 'numbers come from code, words come from the model',
        body: [
          'a model should never do the arithmetic on someone\'s margin, so every price comes out of the business\'s own cost model in code and the model only writes the sentence around it. she has her own avatar, email and instagram, and she signs what she writes.',
          'nothing goes out until a person taps, and owners can approve in plain words. she answers from records, and when she can\'t she asks the right teammate and turns the answer into the reply.',
        ],
        callout: 'a buyer\'s reply can never be written from another buyer\'s facts. businesses are walled off from each other in the database with postgres row level security, so a bad prompt can\'t get through it.',
      },
      {
        label: 'proving it', title: 'tested like it handles real money',
        body: [
          'i keep a fixed eval for her brain. claude haiku scored 40 of 45 the first time and every case passed after the fixes, and i measured a groq model against it at 35 of 45. the suite was at 478 tests the day she went live, and the first real whatsapp round trip and instagram dm both worked that day.',
          'she also ships her own small features. when she hits a gap she builds it as a partial rollout that pulls itself back if it fails.',
        ],
      },
    ],
  },
  {
    slug: 'outbound', name: 'The outbound engine', line: 'Finds the right people and writes each one from their own work.',
    title: 'outreach that reads before it writes',
    subtitle: 'an engine that finds agencies and brands, checks they\'re worth writing to, and writes to each one from something they published. we run it for octyn and aarttsii.',
    meta: [['role', 'built it'], ['stack', 'python, typescript, postgres'], ['scale', '12 inboxes, 6 domains'], ['volume', '120 emails a day']],
    colors: { fg: '#1C2329', body: '#3C464E', muted: '#6E7A84', accent: '#3A5A78', callout: 'rgba(58, 90, 120, 0.08)', border: '#CDD4DA', bg: '#E9ECEF' },
    sections: [
      {
        label: 'how it runs', title: 'a graph of companies, walked every night',
        body: [
          'it walks a graph of companies, qualifies each one, checks every address and writes the first line from that company\'s own published work. emails go out at 8 to 10am in their time zone, with follow ups at 3 and 7 days if it stays quiet.',
          'two gates run before anything gets enriched, one for mentality and one for feasibility. i also stopped keeping lists of where to look, because a source pattern regenerates for each client and a list of urls goes stale.',
        ],
      },
      {
        label: 'deliverability', title: 'measured down to the guess',
        body: [
          'verified addresses bounced 0 of 313. guessed addresses at catch-all domains bounced 16.1 percent, which would hurt every inbox on the domain, so guesses now spend from a daily bounce budget. all of it runs on our own sender on our own vps, and every bounce and reply gets read back in.',
        ],
        grid: [['0 of 313', 'verified addresses that bounced'], ['16.1%', 'bounce rate on guessed addresses, now capped by budget'], ['12 and 6', 'inboxes and domains, 120 emails a day'], ['+3 and +7', 'days for each follow up']],
      },
      {
        label: 'trust', title: 'no model anywhere near the send button',
        body: [
          'drafting uses a model and sending doesn\'t. a model once reported a send that never happened, so the sender became plain code that either sent or logged why it didn\'t. drafts arrive in telegram as cards i can send, edit or skip.',
          'on aarttsii\'s lists this is what got 37 of 212 brands to reply, 17 percent, and it\'s how hocco first heard from us.',
        ],
      },
    ],
  },
  {
    slug: 'mooney', name: 'Mooney', line: 'Say what you spent, and it lands in the list.',
    title: 'the expense tracker that listens',
    subtitle: 'mooney is a voice-first expense tracker my cofounder and i built. you hold a button, say what you spent, and it\'s on the list in under 5 seconds.',
    meta: [['role', 'co founded'], ['stack', 'flutter, supabase, deepgram, groq'], ['status', 'live on google play'], ['countries', '60+']],
    href: ['google play', 'https://play.google.com/store/apps/details?id=com.octyn.mooney'],
    colors: { fg: '#1A1A1A', body: '#3a3a3a', muted: '#7E7A74', accent: '#2A6B4F', callout: 'rgba(42, 107, 79, 0.06)', border: '#E0DDD7', bg: '#F2EFE7' },
    sections: [
      {
        label: 'the problem', title: 'expense apps assume you want to type',
        body: [
          'every expense app works the same way. you open it, pick a category from a dropdown, type an amount and maybe add a note, and most people give up after a week. so we made the whole interaction one held button and a sentence.',
        ],
      },
      {
        label: 'the voice pipeline', title: 'four providers that feel like one',
        body: [
          'your voice goes to deepgram for transcription, then a small groq model parses the amount, category and description. if it can\'t work it out it escalates to a bigger model, then cerebras, then openrouter, and you never see any of that happen.',
          'the app itself holds zero provider keys, they all live in supabase edge function secrets.',
        ],
        callout: 'deepgram sometimes hears 20 rupees as 20 arrests, and on-device ocr reads the rupee symbol as random letters depending on the font. a lot of the work was post processing and keyword boosting for moments like those.',
      },
      {
        label: 'the android side', title: 'two processes talking through a file',
        body: [
          'the app runs two android processes, the main app and an overlay that lets you log from a home screen widget without opening anything. the overlay can\'t reach the local database, so the two have to hand work over carefully. there\'s native kotlin for the widgets, the overlay and a listener for transaction notifications.',
          'receipts go through three tiers, on-device ml kit, then groq vision, then gemini as the last fallback.',
        ],
      },
      {
        label: 'the feel', title: 'a receipt with a cow on it',
        body: [
          'the whole app looks like a receipt, with torn edges, dashed dividers, ibm plex mono and warm cream paper. the mascot is a cow in green overalls with a money bag on its head, and there are 19 colourways of it for avatars.',
        ],
      },
    ],
  },
  {
    slug: 'rag', name: 'RAG + memory', line: 'The search under this call, built from how real systems do it.',
    title: 'the search under this call',
    subtitle: 'a retrieval and memory engine i can fork into any product. when you ask ashwini something in the call, this is what finds the notes he answers from.',
    meta: [['role', 'solo built'], ['stack', 'typescript, postgres, gemini embeddings'], ['tested on', '32 question golden set'], ['used by', 'this portfolio']],
    colors: { fg: '#241B22', body: '#44383F', muted: '#7A6C74', accent: '#7A4A68', callout: 'rgba(122, 74, 104, 0.08)', border: '#D8CDD4', bg: '#EFEAEE' },
    sections: [
      {
        label: 'the approach', title: 'read the real systems first',
        body: [
          'i went through what production systems actually do, onyx, ragflow, dify, r2r, graphiti, mem0 and llamaindex, and wrote it down with file paths. every default in the design cites that research, and changing one takes evidence or an eval run.',
          'it searches by words and by meaning and fuses the two, adds a little recency, reranks, and pulls in neighbouring text. answers cite their sources and say so when the notes don\'t cover something. memory keeps raw episodes and facts, and retires a fact when a newer one contradicts it.',
        ],
      },
      {
        label: 'measuring it', title: 'the right note first, about twice as often',
        body: [
          'on a fixed golden set the old word overlap put the right note first 38 percent of the time. the engine, weighted two to one toward meaning, got to 81 percent when i measured it on 31 october, with the right note in the top three 97 percent of the time.',
          'i tested that weighting against equal weights and it won, so that\'s what shipped.',
        ],
        grid: [['38% to 81%', 'right note first, old search against this one, 31 oct'], ['97%', 'right note in the top three'], ['100%', 'must-have facts present in answers on the eval']],
      },
      {
        label: 'in the call', title: 'you can ask it how it knows',
        body: [
          'after any answer you can ask ashwini how he knows, and he lays out the notes it came from with the matching words marked. there\'s also a miniature in the call where you watch the real search rank my notes.',
          'if the embedding provider runs out of quota it drops to word search, and the answer checks still pass.',
        ],
      },
    ],
  },
  {
    slug: 'streamer', name: 'The AI streamer', line: 'A character who codes real projects live and plays what he builds.',
    title: 'a streamer who ships',
    subtitle: 'octyn is my tv-headed character, and he streams on his own. he codes real projects live, talks to chat, and plays the games he builds.',
    meta: [['role', 'solo built'], ['brain', 'claude'], ['voice', 'local tts on my gpu'], ['body', 'webcam mocap']],
    colors: { fg: '#E8E2D2', body: '#BDB6A8', muted: '#8E8779', accent: '#E3A94F', callout: 'rgba(227, 169, 79, 0.1)', border: '#34302B', bg: '#16171B' },
    sections: [
      {
        label: 'the idea', title: 'real code from a clean canvas',
        body: [
          'i looked for an ai streamer that ships real software across streams with a body driven by mocap and couldn\'t find one, so i built it. my rule is that the build happens live from nothing and ends up running somewhere public, so nothing on stream is prebuilt.',
          'he has a room with life in it. a cat naps, walks across his keyboard, steals the mouse and sits on his tv, and chat can spin his chair or turn the lights off.',
        ],
      },
      {
        label: 'making it feel live', title: 'measured against people',
        body: [
          'the voice runs locally on my gpu and i tuned it against measured human pitch, pace and pause ranges. on the first full test stream he answered chat in 2.2 seconds at the median and 2.5 at p90, and capture dropped 1 frame of 18,045.',
        ],
        grid: [['2.2 s', 'median time to his first reply'], ['1 of 18,045', 'frames dropped in capture at 30 fps']],
      },
      {
        label: 'where it went', title: 'this call is a fork of that stage',
        body: [
          'the room you sit in on this site started as his stream stage. a webcam rig drives his face and hands in real time and can even act as a google meet camera.',
        ],
      },
    ],
  },
  {
    slug: 'reels', name: 'The reel engines', line: 'Code that draws, animates and checks its own short videos.',
    title: 'reels drawn entirely in code',
    subtitle: 'a set of engines that draw and animate short videos of octyn and his world, then check their own work before i ever see it.',
    meta: [['role', 'solo built'], ['styles', '12 drawn in code'], ['stack', 'three.js, mediapipe, ffmpeg'], ['ships to', 'youtube shorts']],
    colors: { fg: '#2A2230', body: '#4A4150', muted: '#7C7284', accent: '#7A5AA8', callout: 'rgba(122, 90, 168, 0.08)', border: '#D6D0DC', bg: '#EFECF2' },
    sections: [
      {
        label: 'the lab', title: 'twelve styles and a qa gate',
        body: [
          'the reel lab draws 9:16 reels in 12 styles from code, pixel art, paper cut, risograph, ascii and watercolour among them. a qa gate checks hand anatomy, caption safe zones, cut timing and audio rules in code, so a bad frame fails before it reaches me.',
          'i kept testing formats against real views and moved on when one didn\'t hold attention. every beat has to pay off with the sound off.',
        ],
      },
      {
        label: 'the pipeline', title: 'ready for me every morning',
        body: [
          'the shorts engine renders fast educational reels by itself at 5:30 every morning and holds them for review. they arrive in telegram, and tapping approve publishes to the octyn channel on youtube.',
          'the skits engine puts octyn on screen with a cast of watercolour blob characters, and those same characters are who you dress up in the lobby of this site.',
        ],
      },
    ],
  },
  {
    slug: 'inkling', name: 'Inkling', line: 'Markdown notes on your disk, with real multiplayer.',
    title: 'notes that stay on your disk, and still sync',
    subtitle: 'inkling is a local-first markdown workspace for desktop. your notes are plain files, your vault is a github repo, and two people can write in the same note at once.',
    meta: [['role', 'solo built'], ['stack', 'electron, codemirror, yjs, isomorphic-git'], ['platforms', 'windows, linux'], ['site', 'inkling.octyn.co']],
    href: ['inkling.octyn.co', 'https://inkling.octyn.co'],
    colors: { fg: '#E4E6EA', body: '#B4B8C0', muted: '#868B95', accent: '#8FB2CF', callout: 'rgba(143, 178, 207, 0.1)', border: '#2C2F36', bg: '#16171B' },
    sections: [
      {
        label: 'the idea', title: 'your notes should outlive the app',
        body: [
          'every note is a plain markdown file in a real folder, and it works fully offline. making your vault a github repo means sync comes free and you already own the history.',
        ],
      },
      {
        label: 'the hard part', title: 'two people, one word',
        body: [
          'real time editing is built on crdts with yjs, with presence, panes, a canvas and a link graph on top. the test i cared about was two people fighting over the same word, and it merged cleanly.',
          'it updates itself through a tagged release pipeline, so a new version reaches people without them doing anything.',
        ],
      },
    ],
  },
  {
    slug: 'portfolio', name: 'This call', line: 'Why my portfolio is a video call, and how it stays honest.',
    title: 'my portfolio is a call',
    subtitle: 'you\'re interviewing me. you walk in from a lobby, your webcam drives a watercolour character, and you talk to me across my desk.',
    meta: [['role', 'solo built'], ['stack', 'next.js, react, three.js, mediapipe'], ['voice', 'deepgram'], ['answers', 'my own rag engine']],
    colors: { fg: '#E8E2D2', body: '#C2BBAC', muted: '#8E8779', accent: '#E3A94F', callout: 'rgba(227, 169, 79, 0.1)', border: '#34302B', bg: '#121214' },
    sections: [
      {
        label: 'the room', title: 'poke anything',
        body: [
          'it\'s a fork of my streamer\'s stage with a painted room and him still in pixels. you can drag the camera around, steal his coffee, knock his monitor over and watch him pick it up, scramble the cube on his desk, or pick up his guitar and play it with your hands in the air.',
          'he remembers all of it. he holds a grudge when you poke him, he gets shorter with you when you\'re rude, and an apology buys most of it back.',
        ],
      },
      {
        label: 'the tracking', title: 'your camera stays in your tab',
        body: [
          'mediapipe tracks your face and hands in the browser and your video never leaves it. at first it took 61 percent of the main thread and the whole thing lagged, so tracking moved into a worker and the main thread went to about 75 percent idle.',
        ],
      },
      {
        label: 'keeping it honest', title: 'rules as tests',
        body: [
          'answers come from about 190 notes i wrote on myself, and you can ask him to show which ones. before he says anything it passes a guard for things a candidate shouldn\'t do, like sounding like a generated tagline, and every written line on the site goes through the same check as a test.',
          'his speech recognition is tuned for my product names too, and that took it from 0 of 8 to 8 of 8 on hearing them right.',
        ],
      },
    ],
  },
  {
    slug: 'sanshu', name: 'SANSHU!', line: 'Lead 3D artist, and where the visual side of all this comes from.',
    title: 'where the characters come from',
    subtitle: 'before products i was a 3D artist. i was one of the earliest people on the team at sanshu, and i prototyped their mascots and helped set how the whole brand looks.',
    meta: [['role', 'lead 3D artist'], ['years', '2021 to 2023'], ['tools', 'blender, zbrush, substance'], ['recommended by', 'their ceo']],
    href: ['letter of recommendation', '/sanshu-lor.pdf'],
    colors: { fg: '#2B2118', body: '#4D4136', muted: '#7E7264', accent: '#A9543F', callout: 'rgba(169, 84, 63, 0.08)', border: '#DACFC2', bg: '#F1EBE2' },
    sections: [
      {
        label: 'the work', title: '2,000 masks from 8 animated pieces',
        body: [
          'i designed the yokai mask nft collection, 2,000 unique pieces from 8 animated artworks, made in blender with a remote team across time zones. phase 1 sold out in 3 days.',
          'i also sculpted characters and environments in zbrush and substance painter, and built in-game assets.',
        ],
      },
      {
        label: 'why it matters here', title: 'it\'s why these products look the way they do',
        body: [
          'every product i\'ve worked on since has its own character and its own look, from the cow in mooney to octyn\'s tv head. i still think about how a thing should feel before i think about how it should work.',
        ],
      },
    ],
  },
]

export const caseBySlug = (slug: string) => CASES.find((c) => c.slug === slug)
