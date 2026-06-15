## 🔍 PROMPT 1 — Deep Dive de Arquitetura, Código e Lógica de Negócio

```
Você é um Staff/Principal Engineer fazendo um review técnico crítico e independente de um SaaS
de chatbot RAG whitelabel. Seu objetivo NÃO é elogiar — é encontrar furos, riscos e inconsistências
antes de a gente escrever código de produção.

CONTEXTO A LER (nesta ordem):
1. @todo/SAAS-CHATBOT/CONTEXT.md      — estado compilado do projeto
2. @todo/SAAS-CHATBOT/PLAN.md         — roadmap, fases, decisões (ADRs)
3. @todo/SAAS-CHATBOT/ARCHITECTURE.md — componentes, data flow, contratos
4. @todo/SAAS-CHATBOT/PROGRESS.md     — onde estamos
5. @todo/SAAS-CHATBOT/FUTURE/*.md     — extensões planejadas (contexto de escopo futuro)

ESCOPO DESTE REVIEW (foco: técnico/produto, NÃO financeiro):
- Arquitetura: separação de responsabilidades, modular monolith vs. serviços, multi-tenancy
  (isolamento de dados, vazamento entre tenants), pontos únicos de falha.
- Componentes-chave: llm-adapters (metering/governança), router-adapters, embeddings/vector store,
  ingestion/chunking, knowledge-sync, fila (QStash), API (NestJS), worker (Python), widget.
- Lógica de negócio: metering local como source of truth, prepaid wallet + auto-recharge + hard cap,
  idempotência de cobranças, reserve/hold sob concorrência, anti-loop de recharge.
- Roteamento de modelos: como classificar complexidade da query, fallback entre providers,
  degradação graciosa, qualidade percebida vs. custo.
- Escalabilidade: o salto MVP→Early→Growth→Scale faz sentido? Gargalos? Estado/sessão? Cache?
- Segurança: gestão de chaves (BYOK e Managed), blast radius, PII, data residency, rate limiting.
- Consistência interna: o PLAN/ARCHITECTURE/CONTEXT se contradizem em algum ponto? ADRs coerentes?
- Roadmap: as fases F1–F4 estão na ordem certa? Algo crítico foi deixado para depois indevidamente?
  Algum item de FUTURE/ deveria ser MVP (ou vice-versa)?

COMO RESPONDER:
1. **Resumo executivo** (5–8 linhas): o plano é tecnicamente sólido? Maior risco? Pode codar?
2. **Achados por severidade**: 🔴 Crítico / 🟡 Médio / 🟢 Menor. Para cada um:
   - Onde (arquivo/seção), o problema, por que importa, e a correção sugerida.
3. **Contradições/lacunas** entre os documentos (lista objetiva).
4. **Perguntas abertas** que precisam de decisão antes de implementar.
5. **Top 5 ações priorizadas** (o que eu faria primeiro).

Regras: seja específico (cite seção/arquivo), proponha alternativas concretas, separe FATO de
OPINIÃO, e NÃO entre em análise financeira/margem/custo — isso é coberto por outro review.
```

---

## 💰 PROMPT 2 — Deep Dive Financeiro, Margem, Custos e Gestão do Negócio

```
Você é um CFO/FP&A de SaaS + analista de unit economics fazendo um review financeiro crítico e
independente de um chatbot RAG whitelabel. Seu objetivo é estressar a precificação, a margem e a
sustentabilidade do modelo — encontrar onde os números quebram, não validá-los por gentileza.

CONTEXTO A LER (nesta ordem):
1. @todo/SAAS-CHATBOT/PRICING.md                    — modelo de custo, planos, margem, billing
2. @todo/SAAS-CHATBOT/ANALYSIS/openrouter-pricing.md — custo por token dos modelos
3. @todo/SAAS-CHATBOT/ANALYSIS/model-benchmark.md    — qualidade dos modelos (score)
4. @todo/SAAS-CHATBOT/ANALYSIS/infra.md              — breakeven de infra local (self-host)

MODELO A VALIDAR (resumo do que o PRICING.md propõe):
- Preço público ancorado no CUSTO do modelo premium (Sonnet 4.6 = $9/1M), SEM markup explícito.
- Margem vem da INTELIGÊNCIA DE ROTEAMENTO: mix Opção B (80% Qwen3.7 Plus + 15% DeepSeek V4 Pro +
  5% Sonnet 4.6) → custo misto ~$1.35/1M → spread ~85% vs. a âncora de $9.
- Managed (carteira pré-paga) = padrão em todos os tiers; BYOK = add-on pago só de Enterprise.
- Planos: Free / Starter $19 / Pro $39 / Business $119 / Enterprise custom.

ESCOPO DESTE REVIEW (foco: financeiro, NÃO arquitetura/código):
- Unit economics: a margem ~85% do roteamento se sustenta? O que acontece se o mix real divergir
  (ex.: queries mais difíceis → mais Sonnet)? Faça uma análise de sensibilidade (mix 60/30/10,
  50/30/20, etc.) e mostre onde a margem desce a níveis perigosos.
- Risco de preço dos modelos: os preços do OpenRouter são voláteis e há promos temporárias embutidas.
  O modelo aguenta uma alta de 30–50% no custo do tier principal (Qwen)? E se as promos expirarem?
- Ancoragem: ancorar no Sonnet 4.6 ($9/1M) é defensável competitivamente, ou estamos cobrando caro
  demais / barato demais? Compare com o TCO dos concorrentes (§2–§3 do PRICING).
- Planos & caps: os preços (Starter $19, Pro $39, Business $119) cobrem o pior caso de reingestão
  (§7.3)? A margem-piso de ~45% é confortável ou apertada? O Free (Managed, saldo incluído) é
  realmente risco-zero ou pode sangrar em abuso?
- BYOK Enterprise: a lógica de "piso referenciado no spread abdicado (~$7,6k/mês por 1B tokens)"
  faz sentido? Como você precificaria esse add-on (fixo, % do volume, híbrido)?
- Gestão financeira: prepaid wallet + auto-recharge + hard cap protege o caixa? Risco de
  inadimplência, chargeback, float negativo sob concorrência? Stripe fees e PIX (1.19%) bem modelados?
- Self-host (infra.md): o breakeven da RTX 5090 (~3,6 meses @ 100M tok/mês) está correto e deveria
  acelerar a entrada de um tier local de custo-zero-token? Qual o impacto na margem se entrar?
- Simulações por cliente (§8.2 — 100M a 2B tokens): os números batem? Refaça os cálculos e aponte
  qualquer erro aritmético.

COMO RESPONDER:
1. **Resumo executivo** (5–8 linhas): o modelo financeiro é sustentável? Maior risco à margem?
2. **Verificação aritmética**: recalcule blended cost, spread, margens dos planos e a tabela §8.2.
   Aponte qualquer divergência com número corrigido.
3. **Análise de sensibilidade**: tabela mostrando margem sob diferentes mixes de roteamento e
   diferentes níveis de preço dos modelos (cenário base / estresse / pessimista).
4. **Achados por severidade**: 🔴 Crítico / 🟡 Médio / 🟢 Menor — cada um com seção, impacto em R$/%,
   e correção sugerida.
5. **Riscos de negócio**: dependência de preço de terceiros, promos, volatilidade cambial, abuso.
6. **Top 5 ações priorizadas** para blindar a margem.

Regras: SEMPRE mostre as contas (não só conclusões), use os números reais dos arquivos, separe FATO
de PREMISSA, e NÃO entre em arquitetura/código — isso é coberto por outro review.
```

---
