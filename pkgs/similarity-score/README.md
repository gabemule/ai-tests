# Similarity Score

Semantic similarity engine for activity validation using embeddings and vector similarity.

## Overview

This project implements a lightweight AI service that validates user-provided activities by comparing them semantically against a pre-defined list of allowed activities. It uses sentence transformers for embeddings and cosine similarity for matching, applying configurable thresholds to classify matches as approved, manual review, or rejected.

## Key Features

- **Semantic matching** — understands meaning, not just literal text
- **Zero-shot** — no training required, works out of the box
- **Adapter pattern** — swappable embedding models and search engines (see [ADR-001](docs/adr/001-embedding-adapter-pattern.md) and [ADR-002](docs/adr/002-similarity-search-adapter-pattern.md))
- **Configurable thresholds** — tune for your domain
- **Fast** — in-memory search with scikit-learn (MVP), scalable to pgvector/FAISS (future)
- **REST API** — FastAPI with automatic OpenAPI documentation

## Quick Start

### Prerequisites

- Python 3.12+
- 2GB RAM minimum

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd similarity-score

# Run setup script (creates venv and installs dependencies)
source setup.sh

# Or manually:
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

### Run the API

```bash
make run
# or: uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

- **Interactive docs**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

### Example Request

```bash
curl -X POST http://localhost:8000/match \
  -H "Content-Type: application/json" \
  -d '{
    "activities": [
      "tirar sangue",
      "consulta médica",
      "vacinar bebê"
    ]
  }'
```

### Example Response

```json
{
  "results": [
    {
      "input": "tirar sangue",
      "matched_activity": "Coleta de sangue",
      "similarity": 0.91,
      "status": "approved"
    },
    {
      "input": "consulta médica",
      "matched_activity": "Consulta clínica",
      "similarity": 0.84,
      "status": "approved"
    },
    {
      "input": "vacinar bebê",
      "matched_activity": "Aplicação de vacina",
      "similarity": 0.88,
      "status": "approved"
    }
  ]
}
```

## Architecture

The project follows a **Port & Adapter** pattern (Hexagonal Architecture):

```
Request → API Layer (FastAPI)
           ↓
       Service Layer (MatcherService)
           ↓
       Embedding Layer (Adapter — ADR-001)
           ↓
       Similarity Search Layer (Adapter — ADR-002)
           ↓
       Threshold Engine (Business Rules)
           ↓
       Response
```

### Key Components

- **Embedding Port** — interface for swappable embedding models
- **Similarity Search Port** — interface for swappable search engines
- **Threshold Classifier** — configurable business rules
- **Matcher Service** — orchestrates the entire flow

See [docs/adr/](docs/adr/) for architectural decisions.

## Configuration

Configuration is managed via environment variables or `.env` file:

```bash
# Embedding Configuration
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_ADAPTER=sentence_transformer

# Similarity Search Configuration
SEARCH_ADAPTER=in_memory
TOP_K_RESULTS=5

# Threshold Configuration
THRESHOLD_APPROVED=0.80
THRESHOLD_REVIEW_MIN=0.65

# Data Configuration
ALLOWED_ACTIVITIES_PATH=data/allowed_activities.json
```

## Data

The allowed activities are stored in `data/allowed_activities.json`. To update:

1. Edit the JSON file
2. Restart the API (embeddings are generated at startup)

## Testing

```bash
# Run all tests
make test

# Run with coverage
pytest --cov=app tests/

# Run specific test
pytest tests/test_match_endpoint.py -v
```

## Development

```bash
# Run linter
make lint

# Format code
make format

# Clean up
make clean
```

## Makefile Commands

- `make help` — show available commands
- `make install` — install dependencies
- `make run` — start the API server
- `make test` — run tests
- `make lint` — run linter
- `make format` — format code
- `make clean` — clean up generated files

## Project Structure

```
similarity-score/
├── @todo/                  # Project context and planning
│   ├── CONTEXT.md          # Project knowledge base
│   ├── FUTURE.md           # Roadmap for V2/V3/V4
│   └── MVP/
│       ├── PLAN.md         # MVP plan
│       └── PROGRESS.md     # Execution checklist
├── app/
│   ├── main.py             # FastAPI application
│   ├── core/               # Configuration
│   ├── api/                # REST endpoints and schemas
│   ├── embeddings/         # Embedding layer (ADR-001)
│   ├── similarity/         # Similarity search layer (ADR-002)
│   ├── services/           # Business logic
│   └── repositories/       # Data access
├── data/                   # Allowed activities JSON
├── docs/adr/               # Architecture Decision Records
├── tests/                  # Test suite
├── pyproject.toml          # Dependencies and config
├── Makefile                # Development commands
└── setup.sh                # Setup script
```

## Thresholds

| Score Range | Status         | Action          |
|-------------|----------------|-----------------|
| >= 0.80     | Approved       | Auto-approve    |
| 0.65 - 0.79 | Manual Review  | Human review    |
| < 0.65      | Rejected       | Auto-reject     |

Thresholds are configurable via environment variables.

## Future Roadmap

See [@todo/FUTURE.md](@todo/FUTURE.md) for details:

- **V2** — pgvector, database persistence, authentication, metrics
- **V3** — reranker, categorization, hybrid search, multilingual optimization
- **V4** — LLM validation, intent detection, feedback loop, CNAE integration

## Architecture Decisions

- [ADR-001: Embedding Adapter Pattern](docs/adr/001-embedding-adapter-pattern.md)
- [ADR-002: Similarity Search Adapter Pattern](docs/adr/002-similarity-search-adapter-pattern.md)

## Tech Stack

- **Python 3.12+**
- **FastAPI** — modern, fast web framework
- **sentence-transformers** — embedding generation
- **scikit-learn** — cosine similarity
- **pytest** — testing

## Contributing

Follow SOLID, DRY, and YAGNI principles. See [@todo/CONTEXT.md](@todo/CONTEXT.md) for coding conventions.

## License

[Your license here]

## Contact

Gabriel Mule — gabriel.mule@akadseguros.com.br