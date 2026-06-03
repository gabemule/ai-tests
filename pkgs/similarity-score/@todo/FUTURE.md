# Future Roadmap — Similarity Score

> Tracks evolution beyond MVP. Updated as new features are planned or implemented.

## V2 — Production Ready

**Goal**: Scalability and operational robustness

### Features

- **pgvector integration**: Replace in-memory arrays with PostgreSQL pgvector for persistent vector storage and search
- **Database persistence**: Store allowed activities, embeddings, and metadata in SQL tables
- **Caching layer**: Redis or similar for frequently accessed embeddings
- **Authentication**: API key-based auth (simple) or OAuth2 (advanced)
- **Rate limiting**: Protect against abuse
- **Metrics & monitoring**: Prometheus metrics, structured logging, observability
- **Batch processing**: Accept multiple activities in a single request, process in parallel
- **CI/CD**: Automated testing, Docker image builds, deployment pipeline

### Infrastructure

- Docker containerization
- Deployment to Railway, Render, or AWS ECS
- Managed PostgreSQL with pgvector extension
- Environment-based configuration (dev, staging, prod)

### Estimated Effort

~4 weeks

---

## V3 — High Precision

**Goal**: Reduce false positives through advanced AI techniques

### Features

- **Reranker**: Add cross-encoder as a second pass to refine top-K results
- **Categorization**: Tag activities by domain (medical, legal, financial, etc.) and filter matches by category
- **Hybrid search**: Combine semantic similarity with business rules (e.g., "surgery" can never match "consultation")
- **Multilingual optimization**: Test and benchmark `intfloat/multilingual-e5-base` and `BAAI/bge-m3` for better Portuguese support
- **Confidence calibration**: Adjust thresholds dynamically based on category or historical accuracy

### Data

- Human-labeled validation dataset (100+ examples)
- Precision/Recall metrics tracking
- A/B testing framework for model comparison

### Estimated Effort

~6 weeks

---

## V4 — Advanced AI

**Goal**: Context-aware validation with LLM assistance

### Features

- **LLM validation**: Use GPT-4o-mini or similar as a final judge for ambiguous cases (score 0.65-0.79)
- **Intent detection**: Understand user intent beyond literal text (e.g., "ajudar pacientes" → "consulta clínica")
- **Classification pipeline**: Multi-stage classification with confidence at each stage
- **Feedback loop**: Learn from user corrections (approved/rejected matches) to improve future results
- **CNAE integration**: Automatic mapping of CNAE codes to internal activity codes

### Requirements

- LLM API integration (OpenAI, Anthropic, or self-hosted)
- Feedback storage and analysis pipeline
- CNAE database or API access

### Estimated Effort

~8 weeks

---

## V5+ — Experimental

**Goal**: Research and exploration

### Ideas

- Fine-tuning sentence transformers on insurance-specific data
- Multilingual support (Spanish, English)
- Real-time embedding generation (skip startup cache, compute on-demand)
- Vector database migration (Qdrant, Weaviate, Milvus)
- Graph-based activity relationships
- Anomaly detection (flag activities that don't match anything)

---

## Migration Strategy

When moving from one version to another:

1. **Adapters first**: Implement new adapter (e.g., PgVectorSearchAdapter) alongside old one
2. **Feature flag**: Toggle between old and new implementation via config
3. **A/B test**: Run both in parallel, compare metrics
4. **Gradual rollout**: Shift traffic incrementally (10% → 50% → 100%)
5. **Deprecate old**: Remove old adapter once new one is stable

This ensures zero-downtime transitions and easy rollback.