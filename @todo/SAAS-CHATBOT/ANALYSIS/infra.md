# Infraestrutura Local para LLMs 2026

## GPUs, Macs, Modelos Locais e Breakeven Financeiro

Versão: Junho/2026

---

# Objetivo

Responder:

* Qual hardware comprar?
* Qual modelo roda em cada hardware?
* Qual a VRAM necessária?
* Quanto custa cada opção?
* Quando o hardware se paga?
* Vale mais API ou infraestrutura própria?

Este documento é voltado para:

* LaPlanta
* Agentes
* Chatbots
* Coding Assistants
* Laboratório de IA
* Home AI Lab

---

# Regra Mais Importante

Em LLMs locais:

```text
VRAM > GPU
```

Muita gente compra a GPU mais rápida.

Mas para IA:

A quantidade de VRAM costuma ser mais importante.

---

# Classes de Modelos

## Pequenos

7B–14B

Exemplos:

* Qwen3.6 14B
* Qwen3.5 Coder 14B
* Llama 3.x 8B

Uso:

* chat
* automações
* classificação

---

## Médios

20B–35B

Exemplos:

* Qwen3.6 Coder
* Qwen3.5 Coder
* DeepSeek Lite

Uso:

* coding
* agentes
* atendimento

---

## Grandes

70B

Exemplos:

* Llama 70B
* DeepSeek 70B

Uso:

* engenharia
* agentes avançados

---

## Gigantes

120B+

Exemplos:

* Qwen3-Coder 480B
* DeepSeek V4

Uso:

* laboratório
* pesquisa
* sistemas complexos

---

# NVIDIA RTX 5070

VRAM:

12 GB

Preço estimado Brasil:

R$ 4.000–5.500

---

## Modelos Recomendados

### Excelente

* Qwen3.5 Coder 14B
* Qwen3.6 14B

### Aceitável

* modelos 20B muito comprimidos

### Não recomendado

* 70B

---

## Perfil Ideal

* hobby
* laboratório
* aprendizado

---

# NVIDIA RTX 5070 Ti

VRAM:

16 GB

Preço estimado Brasil:

R$ 6.000–7.500

---

## Modelos Recomendados

### Excelente

* Qwen3.6 Coder 27B Q4
* Qwen3.5 Coder 32B Q4

### Limite confortável

30B

---

## Perfil

* desenvolvedor
* agente local
* chatbot SaaS

---

# NVIDIA RTX 5080

VRAM:

16 GB

Preço estimado Brasil:

R$ 8.000–10.000

---

# Problema

A VRAM é igual à 5070 Ti.

Logo:

```text
Para IA pura:
5070 Ti ≈ 5080
```

Você ganha velocidade.

Mas não ganha modelos maiores.

---

## Minha avaliação

Melhor para:

* jogos
* IA + jogos

Pior para:

* somente IA

---

# NVIDIA RTX 5090

VRAM:

32 GB

Preço estimado Brasil:

R$ 15.000–20.000

---

# Aqui muda tudo

Você sai do mundo:

```text
14B
```

para:

```text
70B
```

---

## Modelos Recomendados

### Excelente

* Qwen3.6 Coder
* Qwen3.5 Coder
* DeepSeek 70B
* Llama 70B

### Muito bons

* Kimi local quantizado

---

## Perfil

* startup
* laboratório
* agente coding
* Home AI Lab

---

# Dual RTX 5090

VRAM efetiva utilizável:

64 GB+

Investimento:

R$ 35.000–45.000

---

## Modelos

* DeepSeek V4
* Qwen3-Coder 480B quantizado
* MoEs enormes

---

## Perfil

* empresa
* pesquisa
* laboratório profissional

---

# Mac Mini M4

Memória:

16–24 GB

Preço:

R$ 5.000–8.000

---

## Modelos

* 7B
* 14B

---

## Ideal

* laboratório leve
* chatbot pessoal

---

# Mac Mini M4 Pro

Memória:

48–64 GB

Preço:

R$ 10.000–15.000

---

## Modelos

* 32B
* alguns 70B quantizados

---

## Perfil

* desenvolvedor
* laboratório local

---

# Mac Studio M4 Max

Memória:

64–128 GB

Preço:

R$ 18.000–30.000

---

## Modelos

* 70B

Confortavelmente.

---

## Melhor ponto dos Macs

Memória unificada.

Os modelos não precisam caber em VRAM dedicada.

---

# Mac Studio M4 Ultra

Memória:

256 GB+

Preço:

R$ 40.000–70.000+

---

## Modelos

* 120B
* 180B
* 200B+

---

# Comparativo Resumido

| Hardware | IA        | Jogos     |
| -------- | --------- | --------- |
| 5070     | Médio     | Excelente |
| 5070 Ti  | Bom       | Excelente |
| 5080     | Bom       | Excelente |
| 5090     | Excelente | Excelente |
| M4 Pro   | Bom       | Ruim      |
| M4 Max   | Excelente | Ruim      |
| M4 Ultra | Extremo   | Ruim      |

---

# Melhor Hardware por Objetivo

## IA Barata

5070 Ti

---

## IA + Jogos

5090

---

## Apenas IA

Mac Studio

---

## Laboratório Profissional

Dual 5090

---

# Breakeven

Agora vem a parte interessante.

---

## Cenário Sonnet 4.6

1 bilhão de tokens/mês

Custo:

$9.000/mês

Dólar:

R$ 5,50

Resultado:

R$ 49.500/mês

---

## RTX 5090

Investimento:

R$ 18.000

---

### Payback

```text
18.000 / 49.500

≈ 0,36 meses
```

Menos de 15 dias.

---

# Cenário Mais Realista

100 milhões de tokens/mês

Sonnet:

≈ R$ 4.950/mês

---

RTX 5090:

R$ 18.000

---

Payback:

```text
18.000 / 4.950

≈ 3,6 meses
```

---

# Cenário Qwen3.6 Plus

100 milhões de tokens/mês

≈ $113

≈ R$ 620

---

RTX 5090

R$ 18.000

---

Payback:

```text
18.000 / 620

≈ 29 meses
```

---

# Conclusão

Quanto melhor o modelo cloud:

mais rápido a infraestrutura local se paga.

---

# Estratégia Recomendada para o Home AI Lab

## Hardware

CPU

Ryzen 9950X3D

---

RAM

128 GB DDR5

---

GPU

RTX 5090 32 GB

---

SO

Ubuntu Server

---

Modelos Locais

* Qwen3.6 Coder
* Qwen3.5 Coder
* DeepSeek
* Llama 70B

---

Modelos Cloud

* Sonnet 4.6
* GPT-5.5

---

# Estratégia Final

Use local para:

* agentes
* automações
* coding repetitivo
* chatbot
* classificação
* RAG

Use cloud para:

* arquitetura
* decisões críticas
* planejamento complexo
* tarefas premium

---

# Minha conclusão para o seu caso

Considerando:

* LaPlanta
* Home AI Lab
* Chatbots
* SaaS
* Coding
* React
* TypeScript
* Agentes
* Cloud Gaming

A melhor relação custo-benefício hoje não é Mac Studio.

Também não é 5080.

É:

1. RTX 5090 32GB
2. 128GB RAM
3. Ryzen 9950X3D
4. Qwen3.6 Coder local
5. Sonnet 4.6 para tarefas premium

Essa combinação entrega o melhor equilíbrio entre:

* custo
* autonomia
* qualidade
* jogos
* laboratório de IA
* escalabilidade futura

e é a arquitetura que eu escolheria para o Projeto Home AI Lab + Cloud Gaming Pessoal.
