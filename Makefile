.PHONY: help setup install run dev test lint format clean

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Initialize project (run: source setup.sh)
	@echo "Run: source setup.sh"
	@echo "This will create venv and install dependencies"

install: ## Install dependencies
	pip install -e ".[dev]"

run: ## Run the API server
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev: run ## Alias for run

test: ## Run tests
	pytest -v

lint: ## Run linter
	ruff check app/ tests/

format: ## Format code
	ruff format app/ tests/

clean: ## Clean up generated files
	rm -rf .venv
	rm -rf __pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
	rm -rf .ruff_cache
	rm -rf build dist *.egg-info