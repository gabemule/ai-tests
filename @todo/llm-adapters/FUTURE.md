# llm-adapters — Future Enhancements

Post-MVP features and improvements.

> **⚠️ Scope reclassification (see `CONTEXT.md` → Library Scope Philosophy):**
> Several items below were promoted from "distant future" to **core**, because they
> are repeatable infrastructure every project rewrites by hand. They are now expected
> as **immediate post-MVP core**, not Phase 4:
> - **Retry + exponential backoff** (was Phase 4 → now core)
> - **Normalized error taxonomy** (was Phase 4 "Error Recovery" → now core)
> - **Token counting** (was Phase 4 → now core)
> - **Streaming with fallback** (was Phase 3 → now core)
> - **Capabilities & model limits** (now core)
>
> Reference implementation already proven in `context-ai`
> (`src/core/ai/claude_client.py`, `token_manager.py`). Items below remain genuinely
> optional/future (cost tracking, A/B testing, ecosystem integrations, etc.).

## Phase 2: Additional Providers


### Anthropic (Claude)
- Claude 3.5 Sonnet, Claude 3 Opus
- Streaming support
- Tool use (function calling)
- Vision support

### Google Gemini
- Gemini Pro, Gemini Ultra
- Multimodal support (text + images)
- Long context windows

### OpenRouter
- Multi-model proxy
- Unified API for multiple providers
- Cost optimization (cheapest model selection)

### Ollama
- Local model hosting
- Privacy-first (no API calls)
- Custom model support

## Phase 3: Advanced Features

### Streaming Support
```typescript
const stream = await llm.chatStream({
  messages: [{ role: 'user', content: 'Tell me a story' }]
})

for await (const chunk of stream) {
  process.stdout.write(chunk.content)
}
```

### Function Calling / Tools
```typescript
const response = await llm.chat({
  messages: [...],
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather',
      parameters: { location: 'string' }
    }
  ]
})

if (response.toolCalls) {
  // Handle tool calls
}
```

### Vision Support
```typescript
const response = await llm.chat({
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        { type: 'image', url: 'https://...' }
      ]
    }
  ]
})
```

### Structured Output
```typescript
const response = await llm.chat({
  messages: [...],
  responseFormat: {
    type: 'json_schema',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    }
  }
})
```

## Phase 4: Production Features

### Rate Limiting
- Automatic retry with exponential backoff
- Respect provider rate limits
- Queue management for high-volume requests

### Caching
- Cache responses for identical requests
- Configurable TTL
- Multiple cache backends (memory, Redis, file)

### Token Counting
- Accurate token counting before API calls
- Cost estimation
- Budget enforcement

### Cost Tracking
```typescript
const llm = LLMProvider.create({
  provider: 'openai',
  costTracking: true
})

const response = await llm.chat(...)
console.log(response.cost)  // $0.0023
console.log(llm.getTotalCost())  // $1.45
```

### Observability
- Logging (structured logs)
- Metrics (latency, token usage, costs)
- Tracing (OpenTelemetry support)

### Error Recovery
- Automatic retry on transient errors
- Fallback to alternative providers
- Circuit breaker pattern

## Phase 5: Developer Experience

### CLI Tool
```bash
llm chat "What is the capital of France?" --provider openai --model gpt-4
llm embed "Hello world" --provider openai
llm providers list
llm models list --provider openai
```

### Configuration File
```yaml
# llm-config.yaml
default_provider: openai
providers:
  openai:
    api_key: ${OPENAI_API_KEY}
    model: gpt-4
    temperature: 0.7
  anthropic:
    api_key: ${ANTHROPIC_API_KEY}
    model: claude-3-5-sonnet-20241022
```

### Type Safety Improvements
- Stricter types for provider-specific features
- Better autocomplete in IDEs
- Runtime validation with Zod/Pydantic

## Phase 6: Advanced Use Cases

### Multi-Provider Routing
```typescript
const llm = LLMProvider.create({
  strategy: 'cheapest',  // or 'fastest', 'most_capable'
  providers: [
    { provider: 'openai', model: 'gpt-4' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet' }
  ]
})
```

### A/B Testing
```typescript
const llm = LLMProvider.create({
  abTest: {
    variantA: { provider: 'openai', model: 'gpt-4' },
    variantB: { provider: 'anthropic', model: 'claude-3-5-sonnet' },
    split: 0.5  // 50/50 split
  }
})
```

### Prompt Templates
```typescript
const llm = LLMProvider.create({ provider: 'openai' })

const template = llm.createTemplate(`
  You are a helpful assistant.
  User question: {{question}}
  Answer in {{language}}.
`)

const response = await template.render({
  question: 'What is AI?',
  language: 'Portuguese'
})
```

## Phase 7: Ecosystem Integration

### LangChain Compatibility
- Drop-in replacement for LangChain LLMs
- Compatible with LangChain chains and agents

### LlamaIndex Compatibility
- Compatible with LlamaIndex query engines
- Custom LLM integration

### Vercel AI SDK Compatibility
- Compatible with Vercel AI SDK
- Streaming support for Next.js

## Non-Goals

These are explicitly **not** planned:

- ❌ **Fine-tuning** - Use provider-specific tools
- ❌ **Model training** - Out of scope
- ❌ **Vector databases** - Use embedding-adapters + separate vector DB
- ❌ **RAG pipelines** - Build on top of this library
- ❌ **Agent frameworks** - Use LangChain/LlamaIndex
- ❌ **UI components** - This is a backend library

## Priority Order

> **Core features come first** (promoted from this file — see reclassification note
> at the top). The list below is the order *after* the core layer is in place.

**Core (immediate post-MVP, before anything below):**
0a. **Retry + exponential backoff** + **normalized errors** (reliability foundation)
0b. **Token counting** (`count_tokens()` per provider)
0c. **Streaming with fallback** (streaming → standard)
0d. **Capabilities & model limits**

**Then:**
1. **Anthropic adapter** (xctx's primary provider — needed by the first real consumer)
2. **Function calling** (critical for agents)
3. **Gemini adapter** (growing popularity)
4. **Vision support** (multimodal use cases)
5. **OpenRouter adapter** (cost optimization)
6. **Ollama adapter** (privacy/local use cases)
7. **Caching** (performance optimization)
8. **Cost tracking** (budget management)


## Community Requests

Track feature requests here as they come in:

- [ ] _No requests yet_
