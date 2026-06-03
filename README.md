# AI Tests Monorepo

Monorepo containing AI/ML experimentation projects.

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
