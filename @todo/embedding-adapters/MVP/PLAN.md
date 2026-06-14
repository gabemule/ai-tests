# embedding-adapters MVP — Plan

## Context

Every project that needs semantic similarity, RAG, or vector search requires implementing embedding generation. This creates:
- **Code duplication** across projects
- **Inconsistent embedding logic** and error handling
- **Wasted time** rewriting the same integrations
- **Difficulty switching providers** (locked into one embedding model)

**Solution:** Create a reusable adapter library with unified interface for all embedding providers.

## Goals

1. **Unified Interface** - Single API for all providers (`EmbeddingProvider.create()`)
2. **TypeScript + Python** - Both languages with identical interfaces
3. **Two Providers in MVP** - OpenAI (API-based) + SentenceTransformers (local)
4. **Batch Support** - Efficient batch encoding
5. **Extensible** - Easy to add new providers later

## Scope

### ✅ In Scope (MVP)

- **OpenAI adapter** (TypeScript + Python) - text-embedding-3-small
- **SentenceTransformers adapter** (Python only initially) - all-MiniLM-L6-v2
- **Port/Protocol interface** (EmbeddingPort)
- **Factory pattern** (EmbeddingProvider.create())
- **Shared types** (Config, Vector)
- **Basic error handling** (API errors, model loading errors)
- **README with usage examples**
- **Basic tests** (unit tests for adapters)

### ❌ Out of Scope (this MVP)

Not in the *first* MVP, but note the split below — see `CONTEXT.md` → Library Scope
Philosophy. Some of these are **immediate post-MVP core**, not distant future.

**Deferred but CORE (build right after MVP — repeatable infra, see `FUTURE.md` note):**
- Model cache (memory + disk) for local models
- Automatic batching (split large inputs)
- Optional normalization (L2)
- Lazy loading + model warm-up strategies
- Rate limiting / retry logic (API providers)

**Genuinely future (optional):**
- Other providers (Cohere, VoyageAI, Ollama, HuggingFace)
- Token counting
- Cost tracking


## Architecture

### Port (Interface/Protocol)

```typescript
// TypeScript
interface EmbeddingPort {
  encode(text: string): Promise<number[]>
  encodeBatch(texts: string[]): Promise<number[][]>
  getDimension(): number
  getModelName(): string
}
```

```python
# Python
class EmbeddingPort(Protocol):
    def encode(self, text: str) -> list[float]: ...
    def encode_batch(self, texts: list[str]) -> list[list[float]]: ...
    def get_dimension(self) -> int: ...
    def get_model_name(self) -> str: ...
```

### Types

```typescript
type EmbeddingConfig = {
  provider: 'openai' | 'sentence-transformers' | 'cohere' | 'voyage' | 'ollama'
  apiKey?: string  // For API-based providers
  model: string
  baseUrl?: string  // For custom endpoints
}

type Vector = number[]
```

### Factory

```typescript
// TypeScript
class EmbeddingProvider {
  static create(config: EmbeddingConfig): EmbeddingPort {
    switch (config.provider) {
      case 'openai':
        return new OpenAIAdapter(config)
      case 'sentence-transformers':
        throw new Error('SentenceTransformers only available in Python')
      default:
        throw new Error(`Unknown provider: ${config.provider}`)
    }
  }
}
```

```python
# Python
class EmbeddingProvider:
    @staticmethod
    def create(config: EmbeddingConfig) -> EmbeddingPort:
        if config.provider == 'openai':
            return OpenAIAdapter(config)
        elif config.provider == 'sentence-transformers':
            return SentenceTransformerAdapter(config)
        else:
            raise ValueError(f"Unknown provider: {config.provider}")
```

### OpenAI Adapter (MVP)

```typescript
class OpenAIAdapter implements EmbeddingPort {
  private client: OpenAI
  private model: string
  private dimension: number

  constructor(config: EmbeddingConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey })
    this.model = config.model
    this.dimension = this.inferDimension(config.model)
  }

  async encode(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    })
    return response.data[0].embedding
  }

  async encodeBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    })
    return response.data.map(item => item.embedding)
  }

  getDimension(): number {
    return this.dimension
  }

  getModelName(): string {
    return this.model
  }

  private inferDimension(model: string): number {
    if (model.includes('text-embedding-3-small')) return 1536
    if (model.includes('text-embedding-3-large')) return 3072
    if (model.includes('text-embedding-ada-002')) return 1536
    return 1536  // default
  }
}
```

### SentenceTransformer Adapter (MVP - Python only)

```python
from sentence_transformers import SentenceTransformer

class SentenceTransformerAdapter:
    def __init__(self, config: EmbeddingConfig):
        self.model_name = config.model
        self.model = SentenceTransformer(self.model_name)
    
    def encode(self, text: str) -> list[float]:
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    
    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()
    
    def get_dimension(self) -> int:
        return self.model.get_sentence_embedding_dimension()
    
    def get_model_name(self) -> str:
        return self.model_name
```

## Phases

### Phase 1: TypeScript Structure (1.5h)
- [ ] Create `typescript/` directory structure
- [ ] Define `EmbeddingPort` interface in `port.ts`
- [ ] Define shared types in `types.ts`
- [ ] Create `EmbeddingProvider` factory in `provider.ts`
- [ ] Setup `package.json` with dependencies
- [ ] Setup `tsconfig.json`

### Phase 2: TypeScript OpenAI Adapter (1.5h)
- [ ] Implement `OpenAIAdapter` in `adapters/openai.ts`
- [ ] Install `openai` SDK dependency
- [ ] Implement `encode()` method
- [ ] Implement `encodeBatch()` method
- [ ] Implement dimension inference
- [ ] Add error handling (API errors, network errors)

### Phase 3: TypeScript Tests (1h)
- [ ] Setup test framework (Jest or Vitest)
- [ ] Write unit tests for OpenAIAdapter
- [ ] Write tests for EmbeddingProvider factory
- [ ] Add mock tests (no API calls)
- [ ] Test dimension inference

### Phase 4: Python Structure (1.5h)
- [ ] Create `python/embedding_adapters/` directory structure
- [ ] Define `EmbeddingPort` Protocol in `port.py`
- [ ] Define shared types in `types.py`
- [ ] Create `EmbeddingProvider` factory in `provider.py`
- [ ] Setup `pyproject.toml` with dependencies

### Phase 5: Python OpenAI Adapter (1.5h)
- [ ] Implement `OpenAIAdapter` in `adapters/openai_adapter.py`
- [ ] Install `openai` SDK dependency
- [ ] Implement `encode()` method
- [ ] Implement `encode_batch()` method
- [ ] Implement dimension inference
- [ ] Add error handling (API errors, network errors)

### Phase 6: Python SentenceTransformers Adapter (1.5h)
- [ ] Implement `SentenceTransformerAdapter` in `adapters/sentence_transformer_adapter.py`
- [ ] Install `sentence-transformers` dependency
- [ ] Implement `encode()` method
- [ ] Implement `encode_batch()` method
- [ ] Implement `get_dimension()` method
- [ ] Add error handling (model loading errors)

### Phase 7: Python Tests (1h)
- [ ] Setup test framework (pytest)
- [ ] Write unit tests for OpenAIAdapter
- [ ] Write unit tests for SentenceTransformerAdapter
- [ ] Write tests for EmbeddingProvider factory
- [ ] Add mock tests (no API calls)

### Phase 8: Documentation (1h)
- [ ] Write README.md with usage examples
- [ ] Document installation (GitHub URL)
- [ ] Document configuration (API keys, models)
- [ ] Add TypeScript example (OpenAI)
- [ ] Add Python examples (OpenAI + SentenceTransformers)
- [ ] Document dimension differences
- [ ] Document error handling

### Phase 9: Integration Testing (1h)
- [ ] Create example TypeScript project
- [ ] Create example Python project
- [ ] Test installation via GitHub URL
- [ ] Test OpenAI embedding generation
- [ ] Test SentenceTransformers embedding generation
- [ ] Verify dimension consistency
- [ ] Verify error handling

**Total Estimated Effort:** ~11 hours

## Success Criteria

✅ MVP is complete when:

1. **TypeScript works (OpenAI):**
   ```typescript
   import { EmbeddingProvider } from '@gabmule/embedding-adapters'
   
   const embedder = EmbeddingProvider.create({
     provider: 'openai',
     apiKey: process.env.OPENAI_API_KEY,
     model: 'text-embedding-3-small'
   })
   
   const vector = await embedder.encode('Hello world')
   console.log(vector.length)  // 1536
   
   const vectors = await embedder.encodeBatch(['Hello', 'World'])
   console.log(vectors.length)  // 2
   ```

2. **Python works (OpenAI):**
   ```python
   from embedding_adapters import EmbeddingProvider
   
   embedder = EmbeddingProvider.create(
       provider='openai',
       api_key=os.getenv('OPENAI_API_KEY'),
       model='text-embedding-3-small'
   )
   
   vector = embedder.encode('Hello world')
   print(len(vector))  # 1536
   
   vectors = embedder.encode_batch(['Hello', 'World'])
   print(len(vectors))  # 2
   ```

3. **Python works (SentenceTransformers):**
   ```python
   embedder = EmbeddingProvider.create(
       provider='sentence-transformers',
       model='all-MiniLM-L6-v2'
   )
   
   vector = embedder.encode('Hello world')
   print(len(vector))  # 384
   ```

4. **Tests pass** (TypeScript + Python)
5. **README is clear** (installation, usage, examples)
6. **Can install via GitHub URL** (both TS and Python)
7. **Error handling works** (API errors, model loading errors)

## Decisions

### Include SentenceTransformers in MVP
**Why:** Demonstrates local vs API-based providers, already proven in similarity-score.
**Trade-off:** Python-only initially (TS version requires ONNX runtime, more complex).

### OpenAI as primary API provider
**Why:** Most common, high quality embeddings, good documentation.
**Trade-off:** Costs money, requires API key.

### No caching in MVP
**Why:** Adds complexity, can be added later.
**Trade-off:** Repeated calls for same text will hit API/recompute.

### GitHub URL distribution
**Why:** Faster iteration, no publish overhead.
**Trade-off:** Not discoverable via npm/PyPI search, but that's fine for personal use.

## Risks & Mitigations

### Risk: TypeScript/Python divergence
**Impact:** Interfaces become inconsistent between languages.
**Mitigation:** Keep interfaces identical, test both with same scenarios.

### Risk: Dimension mismatches
**Impact:** Vectors from different models can't be compared.
**Mitigation:** Document dimensions clearly, `getDimension()` method, tests.

### Risk: Model loading time (SentenceTransformers)
**Impact:** First call is slow, may timeout.
**Mitigation:** Document warm-up strategy, consider lazy loading.

### Risk: API key leakage
**Impact:** Security breach if keys are committed.
**Mitigation:** Document env var usage, add `.env` to `.gitignore`.

## Next Steps After MVP

See `FUTURE.md` for post-MVP enhancements:
- Additional providers (Cohere, VoyageAI, Ollama, HuggingFace)
- Caching layer
- Automatic normalization
- Rate limiting / retry logic
- Token counting
- Cost tracking
- TypeScript SentenceTransformers support (via ONNX)
