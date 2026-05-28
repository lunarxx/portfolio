const GROQ_KEYS = [
  process.env.GROQ_API_KEY!,
  process.env.GROQ_API_KEY_FALLBACK,
].filter(Boolean) as string[]

async function callGroqText(prompt: string, system: string, maxTokens: number) {
  for (const key of GROQ_KEYS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
          max_tokens: maxTokens,
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
      })
      if (res.status === 429) continue
      if (!res.ok) throw new Error(`Groq ${res.status}`)
      return res.json()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('429') && GROQ_KEYS.indexOf(key) < GROQ_KEYS.length - 1) continue
      throw err
    }
  }
  throw new Error('All Groq keys rate limited')
}

async function callGroqVision(prompt: string, base64Image: string, maxTokens: number) {
  for (const key of GROQ_KEYS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'user', content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            { type: 'text', text: prompt },
          ]}],
          max_tokens: maxTokens,
          temperature: 0,
        }),
      })
      if (res.status === 429) continue
      if (!res.ok) throw new Error(`Groq ${res.status}`)
      return res.json()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('429') && GROQ_KEYS.indexOf(key) < GROQ_KEYS.length - 1) continue
      throw err
    }
  }
  throw new Error('All Groq keys rate limited')
}

export interface ParsedExpense {
  amount: number
  category: string
  merchant: string
  currency: string
}

export async function parseExpense(transcript: string): Promise<ParsedExpense> {
  const system = `You parse voice transcripts into expense data. Extract the amount, category, merchant/vendor name, and currency. If currency is unclear, default to INR. If merchant is unclear, use the category as merchant. Return JSON: { "amount": number, "category": string, "merchant": string, "currency": string }`
  const data = await callGroqText(transcript, system, 150)
  const raw = data.choices[0].message.content.trim()
  const parsed = JSON.parse(raw)
  return {
    amount: parsed.amount || 0,
    category: parsed.category || 'other',
    merchant: parsed.merchant || 'Unknown',
    currency: parsed.currency || 'INR',
  }
}

export interface DetectedDetail {
  label: string
  impact: 'low' | 'medium' | 'high'
}

export interface GroqEstimate {
  category: string
  ci: number
  colour_count: number
  confidence: 'High' | 'Medium' | 'Low'
  factors: string[]
  detected_details: DetectedDetail[]
  is_reference: boolean
}

export async function estimateFromImage(base64Image: string, size: string): Promise<GroqEstimate> {
  const prompt = `You are a crochet complexity scorer for a handmade studio.
Analyse this image. Return CI score and detected details only.
Do NOT calculate prices. Do NOT return price_min or price_max.

STEP 0 - IS THIS AN ACTUAL CROCHET/YARN PIECE?
Look at the image carefully. Is this a photo of an actual crocheted/knitted/yarn item, OR is it something else being used as a reference?
If this is NOT an actual crochet piece, set "is_reference": true and still estimate what it would take to crochet this as a custom piece.
If this IS an actual crochet piece, set "is_reference": false.

Customer size: ${size}

STEP 1 - IDENTIFY CATEGORY and its baseline CI:
basic_geometric=0.5, simple_flower=0.8, complex_flower=2.0, bouquet=2.5,
simple_food=1.5, complex_food=3.0, basic_animal=2.0, standard_amigurumi=3.0,
complex_character=4.0, portrait_oc=3.5, portrait_human=5.0,
botanical_detailed=3.5, wearable=2.0, scene_diorama=7.0, structure=6.0

STEP 2 - SCORE AXES 0.0 to 1.0:
part_count: 1=0.0, 2-3=0.2, 4-6=0.4, 7-10=0.6, 11-15=0.8, 16+=1.0
colour_complexity: 1=0.0, 2=0.2, 3-4=0.4, 5-6=0.6, 7-9=0.8, 10+=1.0
surface_detail: None=0.0, Simple=0.2, Moderate=0.4, Detailed=0.6, Complex=0.8, Full=1.0
shape_regularity: Round=0.0, Mostly round=0.2, Mixed=0.4, Shaped=0.6, Organic=0.8
scale_detail: Standard+simple=0.1, Standard+moderate=0.35, Mini+moderate=0.6, Mini+high=0.85
wire_armature: None=0.0, Single=0.3, Multiple=0.5, Full=0.8
miniature_elements: None=0.0, Few=0.3, Several=0.5, Many=0.8
texture_variety: Single=0.0, Two=0.3, Three+=0.6

STEP 3 - CALCULATE CI:
weighted = (part_count*0.30)+(colour_complexity*0.12)+(surface_detail*0.15)+(shape_regularity*0.10)+(scale_detail*0.13)+(wire_armature*0.08)+(miniature_elements*0.07)+(texture_variety*0.05)
ci = min((weighted * 6) + category_baseline, 10.0)

STEP 4 - DETECT DETAILS: Max 5 items. Each: label (1-3 words), impact (low/medium/high).

STEP 5 - FACTORS: Exactly 3 items, each under 8 words, plain language.

Return ONLY raw JSON no markdown no backticks:
{ "is_reference": boolean, "category": "string", "ci": number, "colour_count": number, "confidence": "High"|"Medium"|"Low", "factors": ["string","string","string"], "detected_details": [{"label": "string", "impact": "low"|"medium"|"high"}] }`

  const data = await callGroqVision(prompt, base64Image, 400)
  const raw = data.choices[0].message.content.trim()
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) parsed = JSON.parse(match[0])
    else throw new Error('Failed to parse Groq response')
  }
  return {
    category: (parsed.category as string) || 'unknown',
    ci: Math.min(Math.round(((parsed.ci as number) || 3) * 10) / 10, 10),
    colour_count: (parsed.colour_count as number) || 2,
    confidence: (parsed.confidence as 'High' | 'Medium' | 'Low') || 'Medium',
    factors: (parsed.factors as string[]) || [],
    detected_details: (parsed.detected_details as DetectedDetail[]) || [],
    is_reference: (parsed.is_reference as boolean) || false,
  }
}
