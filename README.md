# AI Tests Monorepo

Monorepo containing AI/ML experimentation projects.

## 🐣 Incubator

This repo is an **incubator** — a sandbox / brainstorming workspace for AI/ML
experiments. Projects start here while **embryonic**: rough prototypes, spikes, and
shared building blocks (e.g. `llm-adapters`, `embedding-adapters`).

Once a project **matures**, it **graduates to its own dedicated repository** before
any publish/deploy. Nothing here is meant to be production-grade in place — the goal
is to validate ideas cheaply, share components across experiments, and extract the
winners into standalone repos.

**Lifecycle:** `idea → spike → embryonic project → matured → graduates to own repo`


## Projects

### 📊 [similarity-score](./pkgs/similarity-score/)

Semantic similarity matching engine for activity validation using sentence transformers.

**Tech Stack:** Python, FastAPI, sentence-transformers, scikit-learn

**Quick Start:**
```bash
cd pkgs/similarity-score
make setup
make run
```

### 🏢 [cnae-checker](./pkgs/cnae-checker/)

CNAE (Brazilian economic activity classification) extraction and validation tool.

**Tech Stack:** Node.js

**Quick Start:**
```bash
cd pkgs/cnae-checker
npm install
node extract.js
```

## Repository Structure

```
ai-tests/
├── pkgs/
│   ├── similarity-score/    # Semantic matching API
│   └── cnae-checker/         # CNAE validation tool
└── README.md                 # This file
```

## Development

Each project is independent with its own dependencies and tooling. Navigate to the specific package directory for detailed documentation.
