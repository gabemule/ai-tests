# Especificação Técnica — Motor de Similaridade Semântica para Validação de Atividades

## Objetivo

Construir um serviço de IA leve capaz de validar atividades enviadas por usuários comparando semanticamente com uma lista pré-definida de atividades permitidas.

O sistema deve identificar similaridade textual baseada em significado (semântica), e não apenas comparação textual literal.

---

# Problema

Sistemas tradicionais de comparação textual possuem limitações:

* dependem de palavras exatas
* falham com sinônimos
* falham com variações linguísticas
* falham com linguagem natural

Exemplo:

| Entrada do Usuário | Resultado Esperado  |
| ------------------ | ------------------- |
| Tirar sangue       | Coleta de sangue    |
| Vacinar paciente   | Aplicação de vacina |
| Consulta médica    | Consulta clínica    |

Mesmo com palavras diferentes, o sistema deve entender que possuem o mesmo significado.

---

# Objetivo do Sistema

Receber uma ou mais atividades informadas pelo usuário e retornar:

* melhor atividade permitida correspondente
* score de similaridade semântica
* status de aprovação/reprovação
* grau de confiança

---

# Escopo do Projeto

## O sistema DEVE:

* receber atividades via API
* gerar embeddings semânticos
* comparar embeddings via similaridade vetorial
* retornar o match mais próximo
* aplicar thresholds configuráveis
* suportar português
* suportar múltiplas atividades por requisição
* permitir atualização da lista de atividades permitidas
* possuir arquitetura escalável

---

# Fora do Escopo (Inicialmente)

## O sistema NÃO deve inicialmente:

* treinar modelos próprios
* usar LLMs generativos
* interpretar contexto conversacional
* inferir intenção complexa
* realizar raciocínio clínico
* validar juridicamente atividades médicas
* substituir sistemas regulatórios

---

# Arquitetura Geral

```txt
Cliente
   ↓
FastAPI REST API
   ↓
Embedding Service
   ↓
Similarity Engine
   ↓
Threshold Engine
   ↓
Response Builder
```

---

# Conceitos Fundamentais

## Embeddings

Embeddings são representações numéricas de textos.

Exemplo:

```txt
"coleta de sangue"
↓
[0.123, -0.884, 0.552, ...]
```

Textos semanticamente parecidos geram vetores próximos.

---

# Similaridade Semântica

O sistema utilizará:

## Cosine Similarity

Para medir proximidade entre vetores.

Resultado:

```txt
0.0 → totalmente diferente
1.0 → semanticamente idêntico
```

---

# Fluxo de Execução

## 1. Carregamento das Atividades Permitidas

Exemplo:

```json
[
  "Aplicação de vacina",
  "Coleta de sangue",
  "Consulta clínica",
  "Exame cardiológico"
]
```

---

## 2. Geração dos Embeddings Permitidos

Executado no startup da aplicação.

Os embeddings permanecem em memória.

---

## 3. Recebimento das Atividades do Usuário

Exemplo:

```json
{
  "activities": [
    "tirar sangue",
    "vacinar criança"
  ]
}
```

---

## 4. Geração dos Embeddings da Entrada

Cada atividade recebida será convertida em embedding.

---

## 5. Similarity Search

O sistema compara:

```txt
embedding_input
VS
embeddings_permitidos
```

---

## 6. Seleção do Melhor Match

O sistema encontra:

* atividade mais próxima
* score mais alto

---

## 7. Aplicação do Threshold

Regra inicial:

| Score       | Resultado      |
| ----------- | -------------- |
| >= 0.80     | Aprovado       |
| 0.65 ~ 0.79 | Revisão Manual |
| < 0.65      | Negado         |

---

# Tecnologias Escolhidas

## Backend

* Python 3.12+
* FastAPI
* Uvicorn

Motivos:

* simplicidade
* alta performance
* ótimo ecossistema ML
* documentação automática

---

# IA / NLP

## Sentence Transformers

Biblioteca principal:

```txt
sentence-transformers
```

---

# Modelo Inicial

## Recomendado

```txt
all-MiniLM-L6-v2
```

Benefícios:

* leve
* rápido
* baixo consumo
* excelente custo-benefício

---

# Alternativas Futuras

## Melhor suporte multilíngue

```txt
intfloat/multilingual-e5-base
```

ou

```txt
BAAI/bge-m3
```

---

# Similarity Engine

## Biblioteca

```txt
scikit-learn
```

Função:

```python
cosine_similarity()
```

---

# Estrutura do Projeto

```txt
app/
├── api/
│   ├── routes/
│   └── schemas/
│
├── core/
│   ├── config/
│   └── logging/
│
├── embeddings/
│   ├── model_loader.py
│   ├── encoder.py
│   └── cache.py
│
├── similarity/
│   ├── engine.py
│   ├── thresholds.py
│   └── scorer.py
│
├── repositories/
│   └── allowed_activities.py
│
├── services/
│   └── matcher_service.py
│
├── tests/
│
└── main.py
```

---

# API Specification

# Endpoint

## POST `/match`

Responsável por validar atividades.

---

# Request

```json
{
  "activities": [
    "tirar sangue",
    "consulta médica"
  ]
}
```

---

# Response

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
    }
  ]
}
```

---

# Regras de Negócio

# Thresholds

## Approved

```txt
score >= 0.80
```

---

## Manual Review

```txt
0.65 <= score < 0.80
```

---

## Rejected

```txt
score < 0.65
```

---

# Estratégia de Escalabilidade

## MVP

Armazenamento em memória:

```txt
RAM
```

Adequado até:

```txt
~10.000 atividades
```

---

# Escala Intermediária

Adicionar:

## pgvector

Benefícios:

* integração PostgreSQL
* busca vetorial
* persistência
* simplicidade operacional

---

# Escala Alta

Possíveis soluções:

* Qdrant
* Weaviate
* FAISS
* Milvus

---

# Persistência

## Inicialmente

Arquivo JSON:

```txt
allowed_activities.json
```

---

# Futuramente

Tabela SQL:

```sql
allowed_activities
```

Campos:

| Campo      | Tipo      |
| ---------- | --------- |
| id         | UUID      |
| activity   | TEXT      |
| embedding  | VECTOR    |
| created_at | TIMESTAMP |

---

# Performance Esperada

## MVP

| Item           | Valor        |
| -------------- | ------------ |
| Tempo médio    | 20ms ~ 100ms |
| Throughput     | Alto         |
| Infra mínima   | CPU comum    |
| GPU necessária | Não          |

---

# Segurança

## Necessidades iniciais

* rate limit
* autenticação API Key
* logs
* timeout
* validação de payload

---

# Observabilidade

## Logs recomendados

Registrar:

* atividade recebida
* match encontrado
* score
* tempo de execução

---

# Métricas

Monitorar:

* taxa de aprovação
* taxa de falso positivo
* taxa de falso negativo
* média de similaridade
* tempo de resposta

---

# Principal Risco Técnico

## Falsos Positivos Semânticos

Exemplo:

```txt
"cirurgia cardíaca"
```

matching com:

```txt
"consulta cardiológica"
```

porque semanticamente possuem proximidade.

---

# Estratégias de Mitigação

## Curto prazo

* thresholds mais altos
* revisão manual

---

## Médio prazo

Adicionar:

* categorias
* tags
* regras de domínio

---

## Longo prazo

Arquitetura híbrida:

```txt
semantic search
+
cross encoder reranker
+
business rules
```

---

# Roadmap Técnico

# V1 — MVP

## Objetivo

Validar semanticamente atividades.

### Features

* embeddings
* similarity
* threshold
* API REST
* memória RAM

---

# V2 — Produção

## Objetivo

Escalabilidade e persistência.

### Features

* pgvector
* persistência SQL
* cache
* autenticação
* métricas

---

# V3 — Alta Precisão

## Objetivo

Reduzir falsos positivos.

### Features

* reranker
* cross encoder
* categorização
* regras híbridas

---

# V4 — IA Avançada

## Objetivo

Contextualização avançada.

### Features

* LLM validation
* classification pipeline
* intent detection

---

# Estratégia de Testes

## Dataset de Validação

Criar dataset contendo:

| Entrada      | Resultado Esperado  |
| ------------ | ------------------- |
| tirar sangue | coleta de sangue    |
| vacinar bebê | aplicação de vacina |

---

# Métricas

Avaliar:

* Precision
* Recall
* Accuracy
* F1 Score

---

# Deploy

## Recomendado inicialmente

* Docker
* Railway
* Render
* ECS

---

# Infraestrutura Mínima

## CPU

2 vCPU já é suficiente inicialmente.

---

# Memória

2GB RAM suficientes para MVP.

---

# Custos Esperados

## MVP

Baixíssimo.

Sem GPU.

Sem treinamento.

Sem inferência pesada.

---

# Benefícios da Solução

* simples
* rápida
* barata
* escalável
* explicável
* previsível
* fácil manutenção

---

# Limitações

* não entende contexto complexo
* não possui raciocínio
* pode gerar falsos positivos
* depende da qualidade do threshold
* depende da qualidade da lista permitida

---

# Conclusão

O projeto propõe um motor de validação semântica leve utilizando embeddings e busca vetorial para comparar atividades informadas pelos usuários com uma lista de atividades autorizadas.

A solução evita treinamento inicial de modelos próprios, reduz custos operacionais e permite rápida evolução arquitetural conforme aumento de escala e necessidade de precisão.

A arquitetura foi desenhada para suportar evolução incremental sem necessidade de reescrita completa do sistema.
