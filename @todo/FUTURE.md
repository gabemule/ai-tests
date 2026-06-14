# AI Adapters Ecosystem — Future Libraries

> Ideas for additional adapter libraries following the same Hexagonal Architecture pattern.
> Last updated: 2026-06-14

## Current Libraries

- ✅ **llm-adapters** - Chat completions, function calling, vision (OpenAI, Anthropic, Gemini, OpenRouter, Ollama)
- ✅ **embedding-adapters** - Semantic embeddings for RAG/search (OpenAI, SentenceTransformers, Cohere, VoyageAI, Ollama)

---

## Candidate Libraries for Future Development

### 🔍 reranker-adapters (HIGH PRIORITY)

**Purpose:** Semantic reranking for improved search/RAG results.

**Why it matters:**
- Complements `embedding-adapters` perfectly
- Critical for high-quality RAG pipelines
- Improves search relevance significantly

**Use case:**
```typescript
const reranker = RerankerProvider.create({ provider: 'cohere' })

const results = await reranker.rerank({
  query: 'What is machine learning?',
  documents: searchResults,
  topK: 5
})
```

**Providers:**
- **Cohere** - rerank-english-v3.0, rerank-multilingual-v3.0 (API-based)
- **Cross-Encoder** - Local models (ms-marco-MiniLM, etc.)
- **Jina AI** - jina-reranker-v1 (API-based)
- **Voyage AI** - rerank-lite-1 (API-based)

**Priority:** ⭐⭐⭐⭐⭐ (5/5)
- Directly enhances RAG quality
- Natural companion to embedding-adapters
- Multiple providers available
- Clear use case

---

### 🔀 router-adapters (model routing / cascading)

**Purpose:** Route each request to the cheapest model that can handle it — classify
intent/complexity, then cascade simple queries to a cheap model and complex ones to an
expensive model.

**Why it matters:**
- Directly lowers **average** LLM cost per answer → raises margin in passthrough/Managed billing
- Natural governance/cost layer on top of `llm-adapters`
- Born from the SAAS-CHATBOT Managed mode economics (see `@todo/SAAS-CHATBOT/PRICING.md` §8)

**Use case:**
```typescript
const router = RouterProvider.create({ provider: 'heuristic' })

const choice = await router.route({
  query: 'What are your business hours?',
  candidates: ['gpt-4o-mini', 'gpt-4o'],
  context: { complexityHint: 'low' }
})
// → { model: 'gpt-4o-mini', reason: 'low-complexity factual lookup' }
```

**Providers / strategies:**
- **Heuristic** - length/keyword/regex rules (cheap, local, deterministic)
- **Classifier** - small LLM or embedding-based intent/complexity classifier (local)
- **OpenRouter Auto / NotDiamond / Martian** - external routing services (API-based)
- **Ollama (self-hosted)** - open-source model as a **zero-token-cost** tier in the cascade;
  trades variable token cost for fixed infra/GPU cost — only worth it at volume, with a
  quality/ops tradeoff (evaluate before committing)

**Priority:** ⭐⭐⭐⭐ (4/5)
- Tied directly to SAAS-CHATBOT Managed-mode margin
- Clear cost-optimization payoff
- Self-hosted Ollama tier is a strong long-term lever at volume

---

### 💬 channel-adapters (messaging channels)

**Purpose:** Deliver the RAG bot **where the customer already is** — abstract messaging channels
(WhatsApp first) behind one interface, so the same bot serves web widget, WhatsApp, Telegram, etc.

**Why it matters:**
- The vector that gets SAAS-CHATBOT closest to the BR atendimento niche (Zenvia/Blip/Movidesk/
  Tallos) **without becoming a support suite** — "RAG-on-docs on the customer's channel"
- Born from the SAAS-CHATBOT market benchmark (see `@todo/SAAS-CHATBOT/PRICING.md` §2.3 and
  `@todo/SAAS-CHATBOT/FUTURE/01-channels.md`)
- Channels are where the incumbents' high ticket lives; connecting to them harvests that value
  without inheriting the human-operation/BSP cost

**Use case:**
```typescript
const channel = ChannelProvider.create({ provider: 'whatsapp-cloud' })

await channel.sendMessage({
  to: '+5511999999999',
  text: 'Olá! Como posso ajudar?'
})

channel.onMessage(async (msg) => {
  const answer = await ragBot.ask(msg.text)
  await channel.reply(msg, answer)
})
```

**Providers / channels:**
- **WhatsApp** - Meta **Cloud API** (direct) as the base; **BSPs** (Zenvia, Blip, Twilio,
  360dialog) as variations — tradeoff of cost vs. approval friction vs. dependency
- **Telegram** - Bot API (simple, free, good for early testing)
- **Web Widget** - our existing channel (normalize it behind the same interface)
- **Instagram / Messenger** - Meta Graph API (future)
- **SMS / RCS** - via BSP/Twilio (future)

**Priority:** ⭐⭐⭐⭐ (4/5)
- High strategic value for SAAS-CHATBOT, low deviation from the RAG core
- WhatsApp is the dominant BR channel — biggest reach lever locally
- Clear adapter-pattern fit (uniform send/receive across channels)

---

### 🔌 connector-adapters (knowledge source sync)

**Purpose:** Connect external content sources (Google Drive, Notion, URLs) behind one interface and
**detect changes** so the SAAS-CHATBOT can **auto re-embed only what changed** — keeping the bot's
knowledge in sync without manual re-uploads.

**Why it matters:**
- Turns the knowledge base from a **static snapshot** into a **living, synced** one
- Born from SAAS-CHATBOT (see `@todo/SAAS-CHATBOT/FUTURE/07-knowledge-sync.md`)
- Reuses the existing ingestion pipeline (parse → chunk → embed → upsert); only adds a source
  connector + a change trigger

**Use case:**
```typescript
const source = ConnectorProvider.create({ provider: 'google-drive' })

// poll delta or receive a push webhook → list changed files
const changes = await source.listChanges({ since: pageToken })
for (const file of changes) {
  const content = await source.fetch(file.id)
  await ingest(content) // re-embed only this document
}
```

**Providers / sources:**
- **Google Drive** - OAuth + `changes` API (poll) or push notifications
- **Notion** - pages/databases + `last_edited_time`
- **URL / web** - periodic re-crawl with `ETag` / `Last-Modified`
- **Cloud storage** (S3 / Dropbox) - bucket/folder sync

**Priority:** ⭐⭐⭐⭐ (4/5)
- High value for SAAS-CHATBOT (always-current bot), low deviation from the RAG core
- Clear adapter-pattern fit (uniform list-changes / fetch across sources)
- **Boundary:** static/textual content only — live/exact data belongs in `tool-adapters`

---

### 🛠️ tool-adapters (function calling / RAG + actions)

**Purpose:** Let a bot call **the customer's own APIs as tools** at answer time (order tracking,
product search, stock) — turning RAG-only answers into **RAG + actions** (agent-lite). Builds on
`llm-adapters` function calling with a safe executor + per-bot tool registry.

**Why it matters:**
- Answers **live, exact data** that embeddings can't (a spreadsheet of changing prices/stock is the
  wrong fit for embedding — see `connector-adapters` boundary)
- Born from SAAS-CHATBOT (see `@todo/SAAS-CHATBOT/FUTURE/08-tool-calling.md`)
- Deepens the AI-config moat — the suites treat AI as a shallow add-on

**Use case:**
```typescript
const tool = ToolProvider.register({
  name: 'trackOrder',
  endpoint: 'https://customer.api/orders/{orderId}',
  schema: TrackOrderSchema, // OpenAPI / JSON Schema
  auth: encryptedApiKey,
})

// during chat, the model emits a function call → safe executor runs it
const result = await tool.invoke({ orderId: '123' })
```

**Concerns (the hard part):**
- **SSRF protection** (domain allowlist, block internal IPs), timeouts, rate limits
- **Encrypted auth at rest**, schema-bounded args (no free-form injection)
- **Read-only first** — defer write/mutating actions until a confirmation design exists

**Priority:** ⭐⭐⭐⭐ (4/5)
- Big product jump for SAAS-CHATBOT (RAG + actions), reuses `llm-adapters` function calling
- Security design is the main cost, not the AI core

---

### 🎤 speech-adapters (STT - Speech-to-Text)

**Purpose:** Transcribe audio to text.

**Why it matters:**
- Voice interfaces are growing
- Meeting transcription
- Accessibility features

**Use case:**
```typescript
const speech = SpeechProvider.create({ provider: 'openai' })

const transcript = await speech.transcribe({
  audio: audioFile,
  language: 'pt-BR'
})
```

**Providers:**
- **OpenAI** - Whisper (API-based, excellent quality)
- **AssemblyAI** - Multiple models (API-based)
- **Google Cloud** - Speech-to-Text (API-based)
- **Azure** - Speech Services (API-based)
- **Whisper.cpp** - Local Whisper (privacy-first)

**Priority:** ⭐⭐⭐⭐ (4/5)
- Growing demand for voice apps
- Multiple quality providers
- Clear adapter pattern fit

---

### 🔊 tts-adapters (Text-to-Speech)

**Purpose:** Synthesize speech from text.

**Why it matters:**
- Voice assistants
- Accessibility
- Content creation (podcasts, audiobooks)

**Use case:**
```typescript
const tts = TTSProvider.create({ provider: 'elevenlabs' })

const audio = await tts.synthesize({
  text: 'Hello, how can I help you?',
  voice: 'rachel',
  language: 'en-US'
})
```

**Providers:**
- **ElevenLabs** - High-quality, voice cloning (API-based)
- **OpenAI** - TTS-1, TTS-1-HD (API-based)
- **Google Cloud** - Text-to-Speech (API-based)
- **Azure** - Neural TTS (API-based)
- **Coqui TTS** - Local models (privacy-first)

**Priority:** ⭐⭐⭐⭐ (4/5)
- Pairs well with speech-adapters
- Growing market
- Multiple providers

---

### 🖼️ image-gen-adapters (Image Generation)

**Purpose:** Generate images from text prompts.

**Why it matters:**
- Content creation
- Design prototyping
- Marketing materials

**Use case:**
```typescript
const imageGen = ImageGenProvider.create({ provider: 'openai' })

const image = await imageGen.generate({
  prompt: 'A cat in space, digital art',
  size: '1024x1024',
  quality: 'hd'
})
```

**Providers:**
- **OpenAI** - DALL-E 3 (API-based)
- **Stability AI** - Stable Diffusion (API-based)
- **Replicate** - Midjourney, Flux, etc. (API-based)
- **Automatic1111** - Local Stable Diffusion (privacy-first)
- **ComfyUI** - Local workflows (advanced)

**Priority:** ⭐⭐⭐ (3/5)
- Niche use case
- Less critical for most apps
- Complex configuration (many parameters)

---

### 📝 ocr-adapters (OCR / Document Parsing)

**Purpose:** Extract text from images and documents.

**Why it matters:**
- Document processing
- Invoice/receipt parsing
- Form extraction

**Use case:**
```typescript
const ocr = OCRProvider.create({ provider: 'google-vision' })

const text = await ocr.extractText({
  image: imageFile,
  language: 'pt'
})

const structured = await ocr.extractStructured({
  document: invoicePDF,
  schema: InvoiceSchema
})
```

**Providers:**
- **Google Cloud Vision** - OCR + document AI (API-based)
- **Azure Document Intelligence** - Form recognizer (API-based)
- **AWS Textract** - Document extraction (API-based)
- **Tesseract** - Local OCR (open-source)
- **PaddleOCR** - Local OCR (multilingual)

**Priority:** ⭐⭐⭐ (3/5)
- Specific use case (document processing)
- Not needed by most apps
- Complex (many document types)

---

### 🛡️ moderation-adapters (Content Moderation)

**Purpose:** Detect harmful/inappropriate content.

**Why it matters:**
- User-generated content safety
- Compliance (COPPA, GDPR)
- Brand safety

**Use case:**
```typescript
const moderation = ModerationProvider.create({ provider: 'openai' })

const result = await moderation.check({
  text: 'User-generated content here',
  categories: ['hate', 'violence', 'sexual']
})

if (result.flagged) {
  // Handle violation
}
```

**Providers:**
- **OpenAI** - Moderation API (API-based)
- **Perspective API** - Google Jigsaw (API-based)
- **Azure Content Safety** - Microsoft (API-based)
- **Detoxify** - Local models (privacy-first)

**Priority:** ⭐⭐⭐ (3/5)
- Important for UGC platforms
- Not needed by all apps
- Regulatory compliance use case

---

### 🎨 image-edit-adapters (Image Editing)

**Purpose:** Edit/manipulate images with AI.

**Why it matters:**
- Background removal
- Inpainting/outpainting
- Style transfer

**Use case:**
```typescript
const imageEdit = ImageEditProvider.create({ provider: 'stability' })

const edited = await imageEdit.removeBackground({ image: photo })
const inpainted = await imageEdit.inpaint({
  image: photo,
  mask: maskImage,
  prompt: 'a red car'
})
```

**Providers:**
- **Stability AI** - Stable Diffusion inpainting (API-based)
- **Replicate** - Various models (API-based)
- **Remove.bg** - Background removal (API-based)
- **Local models** - ControlNet, etc. (privacy-first)

**Priority:** ⭐⭐ (2/5)
- Very niche
- Complex workflows
- Better served by specialized tools

---

### 🎵 audio-gen-adapters (Music/Audio Generation)

**Purpose:** Generate music and sound effects.

**Why it matters:**
- Content creation
- Game development
- Video production

**Use case:**
```typescript
const audioGen = AudioGenProvider.create({ provider: 'suno' })

const music = await audioGen.generate({
  prompt: 'upbeat electronic music, 120 BPM',
  duration: 30
})
```

**Providers:**
- **Suno** - Music generation (API-based)
- **Stable Audio** - Stability AI (API-based)
- **MusicGen** - Meta (local)

**Priority:** ⭐ (1/5)
- Very niche
- Limited providers
- Experimental technology

---

## Priority Ranking

| Rank | Library | Priority | Rationale |
|------|---------|----------|-----------|
| 1 | **reranker-adapters** | ⭐⭐⭐⭐⭐ | Complements embeddings, critical for RAG |
| 2 | **router-adapters** | ⭐⭐⭐⭐ | Lowers avg LLM cost, raises Managed-mode margin |
| 3 | **channel-adapters** | ⭐⭐⭐⭐ | Delivers RAG bot on WhatsApp & co — key SAAS-CHATBOT reach lever (BR) |
| 4 | **connector-adapters** | ⭐⭐⭐⭐ | Always-current bot — auto re-embed synced sources (Drive/Notion/URL) |
| 5 | **tool-adapters** | ⭐⭐⭐⭐ | RAG + actions — live data via the customer's APIs (function calling) |
| 6 | **speech-adapters** | ⭐⭐⭐⭐ | Growing demand, clear use case |
| 7 | **tts-adapters** | ⭐⭐⭐⭐ | Pairs with speech, voice assistants |
| 8 | **ocr-adapters** | ⭐⭐⭐ | Document processing niche |
| 9 | **moderation-adapters** | ⭐⭐⭐ | UGC platforms, compliance |
| 10 | **image-gen-adapters** | ⭐⭐⭐ | Content creation niche |
| 11 | **image-edit-adapters** | ⭐⭐ | Very niche, complex |
| 12 | **audio-gen-adapters** | ⭐ | Experimental, limited use |

---

## Recommended Development Order

1. **Phase 1 (Current):** `llm-adapters` + `embedding-adapters` (MVP)
2. **Phase 2:** `reranker-adapters` (natural next step, complements embeddings)
3. **Phase 3:** `router-adapters` (cost optimization for SAAS-CHATBOT Managed mode)
4. **Phase 4:** `channel-adapters` (WhatsApp-first reach for SAAS-CHATBOT — see `@todo/SAAS-CHATBOT/FUTURE/01-channels.md`)
5. **Phase 5:** `speech-adapters` + `tts-adapters` (voice ecosystem)
6. **Phase 6:** Evaluate demand for others based on actual usage

---

## Design Principles (Apply to All)

All future adapter libraries should follow:

1. **Hexagonal Architecture** - Ports & Adapters pattern
2. **Protocol/Interface** - Language-appropriate abstraction (TypeScript interface, Python Protocol)
3. **Factory Pattern** - `{Capability}Provider.create()` entry point
4. **Dual Language** - TypeScript + Python implementations
5. **GitHub Distribution** - Start with GitHub URLs, migrate to npm/PyPI if needed
6. **Minimal MVP** - Start with 1-2 providers, expand later
7. **Consistent Naming** - `{capability}-adapters` package name
8. **Documentation** - README, CONTEXT.md, PLAN.md, PROGRESS.md, FUTURE.md

---

## Non-Goals

These are explicitly **not** planned as separate adapter libraries:

- ❌ **Vector databases** - Too complex, use dedicated libraries (Pinecone SDK, Qdrant client, etc.)
- ❌ **RAG frameworks** - Build on top of adapters, not as adapters
- ❌ **Agent frameworks** - Use LangChain/LlamaIndex
- ❌ **Fine-tuning** - Provider-specific, not abstraction-friendly
- ❌ **Model training** - Out of scope

---

## Community Input

Track requests here:

- [ ] _No requests yet_

---

## Notes

- This is a **living document** - update as new AI capabilities emerge
- Focus on **high-value, reusable** abstractions
- Avoid **over-abstraction** - not everything needs an adapter
- Prioritize based on **actual project needs**, not theoretical completeness
