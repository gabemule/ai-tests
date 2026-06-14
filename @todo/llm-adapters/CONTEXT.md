# llm-adapters — Project Knowledge Base

> Maintained by Cline for context recovery between sessions.
> Last updated: 2026-03-06

## Purpose

Reusable TypeScript and Python library for unified LLM provider access. Eliminates the need to reimplement provider integrations in every new project.

## Library Scope Philosophy

> **Guiding principle:** the library owns what you reimplement *identically* in
> every AI project (repeatable infrastructure). The application owns what *changes*
> per project (business rules, UI, response shaping).
>
> **The test:** "Would I rewrite this the same way in the next project?" → if yes,
> it belongs in the library; if it varies per project, it stays in the app.

| ✅ Belongs in the library (repeatable infra) | ❌ Stays in the app (business logic) |
|---|---|
| Retry with exponential backoff (non-retryable 401/403) | Prompt building / templates |
| Normalized errors (`LLMAuthError`, `LLMRateLimitError`, `LLMError`) | Budget / context-window allocation |
| Token counting (`count_tokens()`) before requests | Output formatting / UI (streaming display callbacks) |
| Streaming with unified callback + fallback (streaming → standard) | Persistence / vector store |
| Provider capabilities & model limits (context window, max output) | Orchestration / RAG pipelines |

This boundary is why retry, normalized errors, token counting and streaming —
previously parked in `FUTURE.md` Phase 4 — are reclassified as **core** (see below):
they are precisely the "boring middle" every project rewrites by hand.

## Core Features (beyond the minimal interface)

These move from "distant future" to part of the library's identity. They are the
real reason to depend on the lib instead of calling the SDK directly:

- **Retry + exponential backoff** — transient errors retried, auth errors (401/403) not.
- **Normalized error taxonomy** — every provider's auth/rate-limit/API errors mapped
  to a single set of exceptions, so callers handle errors once.
- **Token counting** — `count_tokens()` per provider (e.g. tiktoken), to budget/trim
  before sending. Counting lives in the lib; *budget allocation* stays in the app.
- **Streaming with fallback** — unified streaming interface with a text callback, and
  automatic fallback to a standard request if streaming fails.
- **Capabilities & model registry** — context window, max output tokens, feature flags
  (`supports_streaming/tools/vision`) exposed per model.

### Reference implementation (proven in production)

`context-ai` (xctx) already implements this boring middle by hand and it is the
**living spec** for these features — copy the design, don't reinvent it:
- `context-ai/src/core/ai/claude_client.py` — retry + backoff, normalized errors
  (`APIError` mapping `AuthenticationError`/`RateLimitError`), streaming with
  `text_callback` + streaming→standard fallback.
- `context-ai/src/core/ai/token_manager.py` — tiktoken-based token counting.
- `context-ai/src/core/ai/ai_client_interface.py` — `AIClientInterface` + `AIResponse`
  + `AIClientFactory` (≈ `LLMPort` + `LLMProvider.create()`).

### Language order: Python-first

**Decision:** implement **Python first**, then mirror the **identical interface** in
TypeScript. (The MVP plan currently interleaves TS and Python phases — Python-first
is the agreed order, with TS following once the Python contract is stable.)

## Stack & Infra


### Languages
- **TypeScript** - Primary implementation for Node.js projects
- **Python** - Primary implementation for Python projects

### Providers (MVP → Future)
- **OpenAI** (MVP) - GPT-4, GPT-3.5, function calling, vision
- **Anthropic** (Phase 2) - Claude 3.5 Sonnet, Claude 3 Opus
- **Google Gemini** (Phase 2) - Gemini Pro, Gemini Ultra
- **OpenRouter** (Phase 2) - Multi-model proxy
- **Ollama** (Phase 2) - Local model hosting

### Distribution
- **GitHub URL dependencies** - `npm install github:gabemule/llm-adapters`
- No npm/PyPI publishing initially (can add later)

## Architecture

### Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────┐
│         Application Layer           │
│   (Your code using the library)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          LLMPort (Protocol)         │
│  - chat(messages) → response        │
│  - chatStream(messages) → stream    │
│  - callFunction(...)                │
│  - supportsVision() → bool          │
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────┐      ┌──────────┐
│  OpenAI  │      │ Anthropic│
│ Adapter  │      │ Adapter  │
└──────────┘      └──────────┘
```

### Key Components

1. **LLMPort (Protocol/Interface)** - Defines the contract all adapters must implement
2. **Adapters** - Provider-specific implementations (OpenAIAdapter, AnthropicAdapter, etc.)
3. **Factory (LLMProvider)** - Creates the correct adapter based on config
4. **Types** - Shared types for messages, responses, configs

### Design Principles

- **Dependency Inversion** - Application depends on LLMPort, not concrete adapters
- **Single Responsibility** - Each adapter handles one provider only
- **Open/Closed** - Easy to add new providers without modifying existing code
- **Interface Segregation** - Clean, minimal interface (chat, stream, tools)

## Conventions

### File Organization
```
typescript/src/
  port.ts              # LLMPort interface
  provider.ts          # LLMProvider factory
  types.ts             # Shared types
  adapters/
    openai.ts          # OpenAI implementation
    anthropic.ts       # Anthropic implementation
    ...

python/llm_adapters/
  port.py              # LLMPort Protocol
  provider.py          # LLMProvider factory
  types.py             # Shared types
  adapters/
    openai_adapter.py  # OpenAI implementation
    anthropic_adapter.py
    ...
```

### Naming Conventions
- **TypeScript**: PascalCase for classes, camelCase for methods
- **Python**: snake_case for everything except class names (PascalCase)
- **Adapters**: `{Provider}Adapter` (e.g., `OpenAIAdapter`, `AnthropicAdapter`)
- **Port**: `LLMPort` (singular, describes the interface)

### Testing Strategy
- Unit tests for each adapter
- Integration tests with real API calls (optional, requires API keys)
- Mock tests for CI/CD (no API keys needed)

## Current State

**Status:** Planning phase
**Next:** Create MVP with OpenAI adapter (TypeScript + Python)

## Active Decisions (ADRs)

### ADR-001: Separate llm-adapters from embedding-adapters
**Decision:** Create two separate libraries instead of one monolithic package.
**Rationale:** 
- Single Responsibility Principle
- Dependency isolation (embeddings don't need chat SDKs)
- Independent evolution (can swap embedding provider without affecting chat)
- Reusability (similarity-score already has EmbeddingPort)

### ADR-002: Use Adapter Pattern with Protocol/Interface
**Decision:** All providers implement a common LLMPort interface.
**Rationale:**
- Proven pattern (already used successfully in similarity-score)
- Easy to swap providers without code changes
- Testability (can mock the port)
- SOLID principles compliance

### ADR-003: Factory Pattern for Provider Creation
**Decision:** Use `LLMProvider.create()` factory instead of direct instantiation.
**Rationale:**
- Hides provider-specific initialization complexity
- Single entry point for all providers
- Easy to add new providers without breaking existing code
- Clean API: `LLMProvider.create({ provider: 'openai', ... })`

### ADR-004: GitHub URL Distribution (MVP)
**Decision:** Distribute via GitHub URLs, not npm/PyPI initially.
**Rationale:**
- Faster iteration (no publish step)
- Private control (no public package maintenance)
- Can migrate to npm/PyPI later if needed
- Sufficient for personal/team use

## Known Pitfalls

### Provider API Differences
- **Message formats vary** - OpenAI uses `role/content`, Anthropic uses different structure
- **Mitigation:** Adapters normalize to common format defined in LLMPort

### Streaming Implementations
- **Each provider has different streaming APIs** - SSE, websockets, async iterators
- **Mitigation:** LLMPort defines unified streaming interface, adapters handle conversion

### Rate Limiting
- **Each provider has different rate limits** - Need provider-specific handling
- **Mitigation:** Future enhancement (not in MVP)

### API Key Management
- **Security risk if hardcoded** - Never commit API keys
- **Mitigation:** Always use environment variables, document in README

### TypeScript/Python Parity
- **Risk of divergence** - TS and Python implementations might drift apart
- **Mitigation:** Keep interfaces identical, test both with same scenarios
