# llm-adapters MVP — Plan

## Context

Every new project requires reimplementing LLM provider integrations (OpenAI, Anthropic, etc.). This creates:
- **Code duplication** across projects
- **Inconsistent error handling** and retry logic
- **Wasted time** rewriting the same integrations
- **Maintenance burden** when providers update APIs

**Solution:** Create a reusable adapter library with unified interface for all LLM providers.

## Goals

1. **Unified Interface** - Single API for all providers (`LLMProvider.create()`)
2. **TypeScript + Python** - Both languages with identical interfaces
3. **OpenAI MVP** - Start with most common provider (OpenAI)
4. **Chat Support** - Basic chat completions working
5. **Extensible** - Easy to add new providers later

## Scope

### ✅ In Scope (MVP)

- **OpenAI adapter** (TypeScript + Python)
- **Basic chat completions** (`chat()` method)
- **Port/Protocol interface** (LLMPort)
- **Factory pattern** (LLMProvider.create())
- **Shared contracts** (Zod schemas → committed JSON Schema; Python validates with
  `jsonschema` — see `CONTEXT.md` ADR-005)
- **Basic error handling** (API errors, network errors)
- **README with usage examples**
- **Basic tests** (unit tests for adapter)

### ❌ Out of Scope (this MVP)

Not in the *first* MVP, but note the split below — see `CONTEXT.md` → Library Scope
Philosophy. Some of these are **immediate post-MVP core**, not distant future.

**Deferred but CORE (build right after MVP — repeatable infra, see `FUTURE.md` note):**
- Streaming support (`chatStream()`) with streaming→standard fallback
- Rate limiting / retry logic (exponential backoff, non-retryable 401/403)
- Token counting — per-provider local estimator as a pre-request guard-rail
  (`max_tokens` budget); provider `usage` stays authoritative for billing (CONTEXT.md ADR-006)
- Normalized error taxonomy (`LLMAuthError`, `LLMRateLimitError`, `LLMError`)
- Provider capabilities & model limits

**Genuinely future (optional):**
- Function calling / tools
- Vision support (image inputs)
- Other providers (Anthropic, Gemini, OpenRouter, Ollama)
- Response caching
- Cost tracking


## Architecture

### Port (Interface/Protocol)

```typescript
// TypeScript
interface LLMPort {
  chat(params: ChatParams): Promise<ChatResponse>
  getModelName(): string
  supportsStreaming(): boolean
  supportsTools(): boolean
  supportsVision(): boolean
}
```

```python
# Python
class LLMPort(Protocol):
    def chat(self, params: ChatParams) -> ChatResponse: ...
    def get_model_name(self) -> str: ...
    def supports_streaming(self) -> bool: ...
    def supports_tools(self) -> bool: ...
    def supports_vision(self) -> bool: ...
```

### Types

```typescript
type Message = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ChatParams = {
  messages: Message[]
  temperature?: number
  maxTokens?: number
}

type ChatResponse = {
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

type ProviderConfig = {
  provider: 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'ollama'
  apiKey: string
  model: string
  baseUrl?: string  // For custom endpoints
}
```

### Factory

```typescript
// TypeScript
class LLMProvider {
  static create(config: ProviderConfig): LLMPort {
    switch (config.provider) {
      case 'openai':
        return new OpenAIAdapter(config)
      // Future: other providers
      default:
        throw new Error(`Unknown provider: ${config.provider}`)
    }
  }
}
```

### OpenAI Adapter (MVP)

```typescript
class OpenAIAdapter implements LLMPort {
  private client: OpenAI
  private model: string

  constructor(config: ProviderConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey })
    this.model = config.model
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: params.messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
    })

    return {
      content: response.choices[0].message.content,
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      }
    }
  }

  getModelName(): string {
    return this.model
  }

  supportsStreaming(): boolean {
    return false  // MVP: not implemented yet
  }

  supportsTools(): boolean {
    return false  // MVP: not implemented yet
  }

  supportsVision(): boolean {
    return false  // MVP: not implemented yet
  }
}
```

## Phases

### Phase 1: TypeScript Structure + Shared Contracts (2.5h)
- [ ] Create `typescript/` directory structure
- [ ] Define Zod schemas in `src/schemas/` (message.ts, chat.ts, config.ts) — source of truth (ADR-005)
- [ ] Add build step: `zod-to-json-schema` → committed `contracts/*.json`
      (message, chat-params, chat-response, usage, provider-config)
- [ ] Define `LLMPort` interface in `port.ts`
- [ ] Derive shared types in `types.ts` (`z.infer` from schemas)
- [ ] Create `LLMProvider` factory in `provider.ts`
- [ ] Setup `package.json` with dependencies (incl. `zod`, `zod-to-json-schema`)
- [ ] Setup `tsconfig.json`
- [ ] Add CI guard: regenerate JSON Schema from Zod and `diff` against committed `contracts/` (fail on drift)

### Phase 2: TypeScript OpenAI Adapter (2h)
- [ ] Implement `OpenAIAdapter` in `adapters/openai.ts`
- [ ] Install `openai` SDK dependency
- [ ] Implement `chat()` method
- [ ] Implement capability methods (supports*)
- [ ] Add error handling (API errors, network errors)

### Phase 3: TypeScript Tests (1h)
- [ ] Setup test framework (Jest or Vitest)
- [ ] Write unit tests for OpenAIAdapter
- [ ] Write tests for LLMProvider factory
- [ ] Add mock tests (no API calls)

### Phase 4: Python Structure (2h)
- [ ] Create `python/llm_adapters/` directory structure
- [ ] Define `LLMPort` Protocol in `port.py`
- [ ] Define shared types in `types.py` (hand-written; JSON Schema is the runtime guard, ADR-005)
- [ ] Add `contracts.py` — load `../contracts/*.json` + `jsonschema` validation helpers
- [ ] Create `LLMProvider` factory in `provider.py`
- [ ] Setup `pyproject.toml` with dependencies (incl. `jsonschema`)

### Phase 5: Python OpenAI Adapter (2h)
- [ ] Implement `OpenAIAdapter` in `adapters/openai_adapter.py`
- [ ] Install `openai` SDK dependency
- [ ] Implement `chat()` method
- [ ] Implement capability methods (supports*)
- [ ] Add error handling (API errors, network errors)

### Phase 6: Python Tests (1h)
- [ ] Setup test framework (pytest)
- [ ] Write unit tests for OpenAIAdapter
- [ ] Write tests for LLMProvider factory
- [ ] Add mock tests (no API calls)

### Phase 7: Documentation (1h)
- [ ] Write README.md with usage examples
- [ ] Document installation (GitHub URL)
- [ ] Document configuration (API keys, models)
- [ ] Add TypeScript example
- [ ] Add Python example
- [ ] Document error handling

### Phase 8: Integration Testing (1h)
- [ ] Create example TypeScript project
- [ ] Create example Python project
- [ ] Test installation via GitHub URL
- [ ] Test basic chat completion
- [ ] Verify error handling

**Total Estimated Effort:** ~12 hours

## Success Criteria

✅ MVP is complete when:

1. **TypeScript works:**
   ```typescript
   import { LLMProvider } from '@gabmule/llm-adapters'
   
   const llm = LLMProvider.create({
     provider: 'openai',
     apiKey: process.env.OPENAI_API_KEY,
     model: 'gpt-4'
   })
   
   const response = await llm.chat({
     messages: [{ role: 'user', content: 'Hello!' }]
   })
   
   console.log(response.content)  // Works!
   ```

2. **Python works:**
   ```python
   from llm_adapters import LLMProvider
   
   llm = LLMProvider.create(
       provider='openai',
       api_key=os.getenv('OPENAI_API_KEY'),
       model='gpt-4'
   )
   
   response = llm.chat(
       messages=[{"role": "user", "content": "Hello!"}]
   )
   
   print(response.content)  # Works!
   ```

3. **Tests pass** (TypeScript + Python)
4. **README is clear** (installation, usage, examples)
5. **Can install via GitHub URL** (both TS and Python)
6. **Error handling works** (API errors, network errors)

## Decisions

### Use OpenAI SDK directly
**Why:** Don't reinvent the wheel. Use official SDKs for API communication.
**Trade-off:** Adds dependency, but saves time and ensures correctness.

### MVP = OpenAI only
**Why:** Most common provider, fastest path to value.
**Trade-off:** Can't use other providers yet, but that's the point of MVP.

### No streaming in MVP
**Why:** Adds complexity (async iterators, SSE handling).
**Trade-off:** Can't use streaming yet, but basic chat is more important.

### GitHub URL distribution
**Why:** Faster iteration, no publish overhead.
**Trade-off:** Not discoverable via npm/PyPI search, but that's fine for personal use.

## Risks & Mitigations

### Risk: TypeScript/Python divergence
**Impact:** Interfaces become inconsistent between languages.
**Mitigation:** Keep interfaces identical, test both with same scenarios.

### Risk: OpenAI API changes
**Impact:** Adapter breaks when OpenAI updates API.
**Mitigation:** Pin SDK versions, add tests to catch breaking changes.

### Risk: API key leakage
**Impact:** Security breach if keys are committed.
**Mitigation:** Document env var usage, add `.env` to `.gitignore`.

## Next Steps After MVP

See `FUTURE.md` for post-MVP enhancements:
- Streaming support
- Function calling
- Vision support
- Additional providers (Anthropic, Gemini, etc.)
- Rate limiting / retry logic
- Caching
- Token counting
- Cost tracking
