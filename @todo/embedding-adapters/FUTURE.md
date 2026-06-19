# embedding-adapters — Future Enhancements

Post-MVP features and improvements.

> **⚠️ Scope reclassification (see `CONTEXT.md` → Library Scope Philosophy):**
> Several items below were promoted from "distant future" to **core**, because they
> are repeatable infrastructure every embedding project rewrites by hand. They are now
> expected as **immediate post-MVP core**, not Phase 3/4:
> - **Model cache (memory + disk)** (was Phase 3 "Caching" → now core)
> - **Automatic batching** (was Phase 3 "Batch Size Optimization" → now core)
> - **Optional normalization** (was Phase 3 → now core)
> - **Lazy loading + warm-up** (was Phase 4 → now core)
> - **Retry with backoff** (API providers, was Phase 4 → now core)
>
> Reference implementation already proven in `context-ai`
> (`src/core/embeddings/model_manager.py`). Items below remain genuinely
> optional/future (cost tracking, ensemble, ecosystem integrations, etc.).
>
> **One more item is now core (see `CONTEXT.md` ADR-006):**
> - **Shared contracts via Zod-first JSON Schema** (was Phase 5 "Runtime validation with
>   Zod/Pydantic") — Zod schemas are the single source of truth, generate committed JSON
>   Schema, Python validates at runtime with `jsonschema`; a CI `diff` guard blocks TS↔Python drift.


## Phase 2: Additional Providers


### Cohere
- embed-multilingual-v3.0
- Excellent multilingual support
- Competitive pricing

### VoyageAI
- voyage-2, voyage-large-2
- Optimized for retrieval tasks
- High quality embeddings

### Ollama
- Local embedding models
- Privacy-first (no API calls)
- Custom model support
- Free (no API costs)

### HuggingFace
- Any HuggingFace model
- Maximum flexibility
- Community models

### Azure OpenAI
- Same as OpenAI but via Azure
- Enterprise compliance
- Different authentication

## Phase 3: Advanced Features

### Caching Layer
```typescript
const embedder = EmbeddingProvider.create({
  provider: 'openai',
  cache: {
    enabled: true,
    backend: 'memory',  // or 'redis', 'file'
    ttl: 3600  // 1 hour
  }
})

// Second call returns cached result
const vector1 = await embedder.encode('Hello')
const vector2 = await embedder.encode('Hello')  // Cached!
```

### Automatic Normalization
```typescript
const embedder = EmbeddingProvider.create({
  provider: 'openai',
  normalize: true  // Auto-normalize all vectors
})

const vector = await embedder.encode('Hello')
// Vector is L2-normalized (magnitude = 1)
```

### Batch Size Optimization
```typescript
const embedder = EmbeddingProvider.create({
  provider: 'openai',
  batchSize: 100  // Auto-split large batches
})

// Automatically splits into multiple API calls
const vectors = await embedder.encodeBatch(largeArray)
```

### Pooling Strategies
```typescript
const embedder = EmbeddingProvider.create({
  provider: 'sentence-transformers',
  pooling: 'mean'  // or 'max', 'cls'
})
```

### Dimension Reduction
```typescript
const embedder = EmbeddingProvider.create({
  provider: 'openai',
  model: 'text-embedding-3-large',
  dimensions: 1024  // Reduce from 3072 to 1024
})
```

## Phase 4: Production Features

### Rate Limiting
- Automatic retry with exponential backoff
- Respect provider rate limits
- Queue management for high-volume requests

### Token Counting
```typescript
const embedder = EmbeddingProvider.create({
  provider: 'openai',
  tokenCounting: true
})

const result = await embedder.encode('Hello world')
console.log(result.tokens)  // 2
console.log(embedder.getTotalTokens())  // 2
```

### Cost Tracking
```typescript
const embedder = EmbeddingProvider.create({
  provider: 'openai',
  costTracking: true
})

const vector = await embedder.encode('Hello')
console.log(embedder.getTotalCost())  // $0.000013
```

### Observability
- Logging (structured logs)
- Metrics (latency, token usage, costs)
- Tracing (OpenTelemetry support)

### Error Recovery
- Automatic retry on transient errors
- Fallback to alternative providers
- Circuit breaker pattern

### Model Warm-up
```typescript
const embedder = EmbeddingProvider.create({
  provider: 'sentence-transformers',
  warmup: true  // Load model immediately
})

await embedder.warmup()  // Explicit warm-up
```

## Phase 5: Developer Experience

### CLI Tool
```bash
embed encode "Hello world" --provider openai --model text-embedding-3-small
embed batch input.txt --provider sentence-transformers --model all-MiniLM-L6-v2
embed providers list
embed models list --provider openai
```

### Configuration File
```yaml
# embed-config.yaml
default_provider: openai
providers:
  openai:
    api_key: ${OPENAI_API_KEY}
    model: text-embedding-3-small
  sentence-transformers:
    model: all-MiniLM-L6-v2
    device: cuda  # or cpu
```

### Type Safety Improvements
- Stricter types for provider-specific features
- Better autocomplete in IDEs
- Runtime validation with Zod/Pydantic

### TypeScript SentenceTransformers Support
- Use ONNX runtime for local models in TypeScript
- Same interface as Python version
- Cross-platform support

## Phase 6: Advanced Use Cases

### Multi-Provider Fallback
```typescript
const embedder = EmbeddingProvider.create({
  providers: [
    { provider: 'openai', model: 'text-embedding-3-small' },
    { provider: 'sentence-transformers', model: 'all-MiniLM-L6-v2' }
  ],
  fallback: true  // Use second if first fails
})
```

### Ensemble Embeddings
```typescript
const embedder = EmbeddingProvider.create({
  ensemble: [
    { provider: 'openai', weight: 0.7 },
    { provider: 'cohere', weight: 0.3 }
  ]
})

// Returns weighted average of both embeddings
const vector = await embedder.encode('Hello')
```

### Semantic Chunking
```typescript
const embedder = EmbeddingProvider.create({
  provider: 'openai',
  chunking: {
    enabled: true,
    maxTokens: 512,
    overlap: 50
  }
})

// Automatically chunks long text
const vectors = await embedder.encode(longDocument)
```

### Multilingual Support
```typescript
const embedder = EmbeddingProvider.create({
  provider: 'cohere',
  model: 'embed-multilingual-v3.0',
  language: 'pt'  // Portuguese
})
```

## Phase 7: Ecosystem Integration

### LangChain Compatibility
- Drop-in replacement for LangChain embeddings
- Compatible with LangChain vector stores

### LlamaIndex Compatibility
- Compatible with LlamaIndex embeddings
- Custom embedding integration

### Vector Database Integration
```typescript
const embedder = EmbeddingProvider.create({ provider: 'openai' })

// Direct integration with vector DBs
await embedder.indexTo('pinecone', { index: 'my-index' })
await embedder.indexTo('qdrant', { collection: 'my-collection' })
```

### Similarity Search Helpers
```typescript
const embedder = EmbeddingProvider.create({ provider: 'openai' })

const query = await embedder.encode('search query')
const docs = await embedder.encode_batch(['doc1', 'doc2', 'doc3'])

// Built-in similarity calculation
const similarities = embedder.cosineSimilarity(query, docs)
const topK = embedder.findTopK(query, docs, k=2)
```

## Phase 8: Specialized Models

### Domain-Specific Models
- Medical embeddings (BioBERT, PubMedBERT)
- Legal embeddings (Legal-BERT)
- Code embeddings (CodeBERT, GraphCodeBERT)
- Scientific embeddings (SciBERT)

### Multilingual Models
- XLM-RoBERTa
- mBERT
- LaBSE (Language-agnostic BERT Sentence Embedding)

### Long Context Models
- LongFormer
- BigBird
- Models with 4K+ token support

## Non-Goals

These are explicitly **not** planned:

- ❌ **Vector databases** - Use separate vector DB libraries
- ❌ **Similarity search engines** - Use separate similarity-search library
- ❌ **RAG pipelines** - Build on top of this library
- ❌ **Fine-tuning** - Use provider-specific tools
- ❌ **Model training** - Out of scope
- ❌ **UI components** - This is a backend library

## Priority Order

> **Core features come first** (promoted from this file — see reclassification note
> at the top). The list below is the order *after* the core layer is in place.

**Core (immediate post-MVP, before anything below):**
0a. **Model cache (memory + disk)** (local model load is expensive)
0b. **Automatic batching** (split large inputs)
0c. **Optional normalization** (L2, affects cosine similarity)
0d. **Lazy loading + warm-up**
0e. **Retry with backoff** (API providers)
0f. **Shared contracts** (Zod-first JSON Schema + Python `jsonschema` validation; ADR-006)

**Then:**
1. **Cohere adapter** (excellent multilingual support)
2. **Ollama adapter** (privacy/local use cases)
3. **Token counting** (cost management)
4. **Cost tracking** (budget management)
5. **VoyageAI adapter** (retrieval optimization)
6. **TypeScript SentenceTransformers** (local TS support)
7. **HuggingFace adapter** (maximum flexibility)


## Community Requests

Track feature requests here as they come in:

- [ ] _No requests yet_

## Integration with similarity-score

Once this library is mature, `similarity-score` can:
1. Replace its internal `EmbeddingPort` with this library
2. Remove `SentenceTransformerAdapter` (use this library instead)
3. Focus on similarity search logic only
4. Benefit from additional providers (OpenAI, Cohere, etc.)

Migration path:
```python
# Before (similarity-score internal)
from app.embeddings import SentenceTransformerAdapter

# After (using embedding-adapters)
from embedding_adapters import EmbeddingProvider

embedder = EmbeddingProvider.create(
    provider='sentence-transformers',
    model='all-MiniLM-L6-v2'
)
```
