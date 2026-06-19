# PROJECT_SPECIFICATION.md

# AKAD Ops Review Automation Platform

**Versão:** 1.0
**Objetivo:** Automatizar completamente a geração da Ops Review dos squads da AKAD Seguros utilizando dados oficiais de dashboards internos, Azure Application Insights e, futuramente, Jira.

---

# 1. Visão Geral

Atualmente o processo de Ops Review é realizado manualmente, envolvendo:

* Acesso a dashboards internos;
* Aplicação de filtros de período;
* Coleta de indicadores;
* Consulta de incidentes;
* Consulta de Availability no Azure;
* Análise dos tickets;
* Consolidação dos dados;
* Criação de um relatório executivo.

O objetivo deste projeto é construir um **Ops Review Bot** em Python capaz de executar todo esse processo automaticamente.

---

# 2. Objetivo da Aplicação

Ao executar:

```bash
python ops_review.py --date 2026-06-15
```

o sistema deve:

1. Determinar o período da análise. (default 7 dias - 1 semana)
2. Coletar incidentes dos squads.
3. Coletar detalhes dos tickets.
4. Coletar Availability das jornadas.
5. Aplicar regras da Ops Review.
6. Gerar indicadores.
7. Gerar análise executiva.
8. Exportar relatórios.
9. Armazenar histórico da execução.

PS: Podemos usar LLM para ajudar em analises e exploracoes para termos conteudo mais robusto.

---

# 3. Ambiente de Execução

A aplicação será executada localmente em um computador corporativo conectado à VPN.

Motivos:

* APIs internas da AKAD estão disponíveis apenas pela rede corporativa;
* Alguns sistemas utilizam autenticação SSO;
* O Azure Portal pode exigir uma sessão autenticada.

---

# 4. Squads Monitorados

## E&O

Código interno:

```
EO
```

Domínio:

Produtos de Errors and Omissions.

---

## Garantias e RD

Código interno:

```
MTS
```

Domínio:

Produtos de Garantias e RD.

---

## Novos Produtos

Código interno:

```
TRA
```

Domínio:

Produtos de Transportes e novas modalidades em validação.

---

# 5. Fontes de Dados

---

# 5.1 Dashboard Interno de Incidentes

## Base URL

```
https://dashboard-plataforma-dev.akadseguros.com.br
```

---

## Endpoint E&O

```
GET /api/incidents/EO
```

Exemplo:

```
https://dashboard-plataforma-dev.akadseguros.com.br/api/incidents/EO?from=2026-05-18&to=2026-06-16&granularity=day
```

---

## Endpoint Garantias e RD

```
GET /api/incidents/MTS
```

Exemplo:

```
https://dashboard-plataforma-dev.akadseguros.com.br/api/incidents/MTS?from=2026-05-18&to=2026-06-16&granularity=day
```

---

## Endpoint Novos Produtos

```
GET /api/incidents/TRA
```

Exemplo:

```
https://dashboard-plataforma-dev.akadseguros.com.br/api/incidents/TRA?from=2026-05-18&to=2026-06-16&granularity=day
```

---

## Parâmetros

| Campo       | Descrição                         |
| ----------- | --------------------------------- |
| from        | Data inicial da consulta          |
| to          | Data final da consulta            |
| granularity | Granularidade da resposta (`day`) |

---

## Dados necessários

Para cada squad obter:

### Indicadores

* Quantidade de incidentes fechados;
* Quantidade de incidentes abertos;
* Quantidade de itens em backlog;
* MTTR;
* MTTA.

### Tickets

Sempre que disponível:

* ID;
* Título;
* Status;
* Datas;
* Tempos relacionados.

---

# 5.2 Azure Application Insights / Workbooks

Responsável pelos indicadores de Availability utilizados no cálculo de SLO.

Inicialmente a coleta será realizada via Playwright.

---

## Jornada 1 — Cotação (Quotation)

Workbook:

```
https://portal.azure.com/#@akadseguros.com.br/resource/subscriptions/59575e19-ec35-44e8-968d-0a209a5db9c6/resourceGroups/AKAD-DIGITAL-PROD/providers/microsoft.insights/workbooks/27a47cd6-fa61-4a0b-92f6-de467e761011/workbook
```

Dados necessários:

* Availability do período;
* Evidência em screenshot.

Target:

```
99,90%
```

---

## Jornada 2 — Checkout

Workbook:

```
https://portal.azure.com/#@akadseguros.com.br/resource/subscriptions/59575e19-ec35-44e8-968d-0a209a5db9c6/resourceGroups/AKAD-DIGITAL-PROD/providers/microsoft.insights/workbooks/1f9cdabe-b815-4f6c-8c4b-4bc8c7eda06b/workbook
```

Dados necessários:

* Availability do período;
* Evidência em screenshot.

Target:

```
99,90%
```

---

## Estratégia Inicial

Fluxo:

```
Playwright
    |
    v
Abre Azure Portal
    |
    v
Abre Workbook
    |
    v
Aplica período
    |
    v
Extrai Availability
    |
    v
Salva evidência
```

---

## Evolução futura

Avaliar substituição por:

* Azure Monitor API;
* Queries KQL do Application Insights;
* APIs dos Workbooks.

---

# 5.3 Jira (Evolução futura)

Objetivo:

Complementar os dados dos tickets.

Dados desejados:

* Chave do ticket;
* Resumo;
* Status;
* Prioridade;
* Data de criação;
* Data de início de atendimento;
* Data de resolução;
* Tempo de atendimento.

---

# 6. Regras Oficiais da Ops Review

---

# 6.1 Incidentes

A métrica principal de incidentes é:

```
Incidentes (#) = tickets fechados no período
```

Nunca realizar:

```
Incidentes = fechados + abertos
```

Incidentes abertos são apenas contexto operacional.

---

# 6.2 MTTR e MTTA

Regras:

* Devem ser obtidos diretamente das fontes oficiais.
* Nunca recalcular.
* Nunca estimar.

---

# 6.3 SLO

Jornadas oficiais:

## Cotação

Target:

```
99,90%
```

---

## Checkout

Target:

```
99,90%
```

---

## Jornada 3 (regra temporária)

Até definição oficial:

```
Target: 99,90%
Realizado: 100%
Status: Dentro da meta
```

---

## Regra de avaliação

```
Availability >= 99,90%
    -> Dentro da meta

Availability < 99,90%
    -> Fora da meta
```

---

## SLO Geral

Cálculo:

```
Jornadas dentro da meta / Quantidade total de jornadas
```

Exemplo:

```
Cotação: 99,28% ❌
Checkout: 43,28% ❌
Jornada 3: 100% ✅

Resultado:

1 / 3 = 33,33%
```

---

# 6.4 TOIL

TOIL representa o esforço operacional do squad.

Deve considerar:

* Volume de incidentes;
* Quantidade de chamados tratados;
* Existência de backlog;
* Necessidade de investigação;
* Acompanhamento operacional;
* Concentração de temas semelhantes.

---

É proibido calcular:

```
TOIL = quantidade de incidentes x MTTR
```

---

## Faixa de interpretação

| Valor | Significado                |
| ----- | -------------------------- |
| 0     | Sem esforço operacional    |
| 1 a 3 | Muito baixo                |
| 4 a 5 | Operação controlada        |
| 6 a 8 | Esforço relevante          |
| 9+    | Alto consumo de capacidade |

O valor deve permitir ajuste manual através de configuração.

---

# 7. Regras de Análise de Tickets

Ao gerar análises textuais:

É proibido inferir:

* Causa raiz;
* Problemas de arquitetura;
* Impacto financeiro;
* Impacto comercial;
* Motivo técnico da falha;
* Correção aplicada;
* Responsáveis.

---

Exemplo correto:

Ticket:

```
Erro no checkout
```

Análise:

```
Incidente relacionado ao fluxo de checkout.
```

---

Exemplo incorreto:

```
Falha de integração impediu a contratação.
```

---

# 8. Fluxo Completo da Aplicação

```
Usuário
 |
 | python ops_review.py --date 2026-06-15
 |
 v

Determinar período
 |
 v

Coletar Dashboard API
 |
 +-- EO
 |
 +-- MTS
 |
 +-- TRA
 |
 v

Normalizar dados
 |
 v

Coletar Azure Workbooks
 |
 +-- Cotação
 |
 +-- Checkout
 |
 v

Aplicar regras de negócio
 |
 v

Calcular:
 - Incidentes
 - SLO
 - TOIL
 |
 v

Gerar análises executivas
 |
 v

Gerar:
 - Markdown
 - HTML
 - PDF
 - JSON histórico
 |
 v

Salvar evidências
```

---

# 9. Estrutura Inicial do Projeto

```
ops-review/

main.py

config/
  squads.yaml
  rules.yaml

connectors/
  dashboard_api.py
  azure_playwright.py
  jira_api.py

domain/
  squad.py
  incident.py
  metrics.py
  slo.py

engine/
  ops_review_engine.py
  analysis_engine.py
  toil_engine.py

reports/
  markdown_generator.py
  html_generator.py
  pdf_generator.py
  templates/
      ops_review.md.jinja

storage/
  sqlite.py
  repository.py

output/
  YYYY-MM-DD/
      ops_review.md
      ops_review.pdf
      ops_review.html
      execution.json

      evidence/
          dashboard/
          azure/
```

---

# 10. Histórico e Evolução

Cada execução deve gerar um snapshot completo:

Exemplo:

```
output/2026-06-15/execution.json
```

Permitindo análises futuras:

* Evolução de incidentes por squad;
* Evolução de MTTR;
* Evolução de MTTA;
* Evolução do SLO;
* Tendências de TOIL;
* Comparação entre períodos.

---

# 11. Roadmap de Implementação

## V1 — MVP

Implementar:

* API dos dashboards internos (EO, MTS, TRA);
* Azure via Playwright;
* Cálculo de indicadores;
* Aplicação das regras da Ops Review;
* Geração de Markdown;
* Geração do JSON da execução.

---

## V2

Adicionar:

* Integração Jira;
* Banco SQLite;
* Comparações históricas.

---

## V3

Substituir automações de tela por APIs oficiais:

* Azure Monitor API;
* KQL Application Insights;
* APIs de Workbooks.

---

## V4

Adicionar:

* Login automatizado;
* Agendamento automático;
* Geração de PDF e HTML;
* Dashboard histórico da própria Ops Review.

---

# 12. Princípio Arquitetural

A aplicação sempre deve priorizar a fonte mais confiável.

Ordem de prioridade:

```
1. APIs internas dos sistemas
2. APIs oficiais (Azure, Jira)
3. Playwright para automação de navegador
4. OCR de telas (último recurso)
```

---

# 13. Regra Mais Importante

A aplicação nunca deve criar informações que não estejam presentes nos dados coletados.

Nunca inferir:

* Causa de incidentes;
* Problemas técnicos internos;
* Impactos de negócio;
* Correções realizadas.

Os comentários devem ser sempre seguros e baseados apenas nos dados disponíveis.

---

# Fim da Especificação

**AKAD Ops Review Automation Platform v1.1**
