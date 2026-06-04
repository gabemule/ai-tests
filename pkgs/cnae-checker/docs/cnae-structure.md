# CNAE Structure — Reference Guide

## What is CNAE?

**CNAE** (Classificação Nacional de Atividades Econômicas) is Brazil's official classification system for economic activities. It is maintained by **IBGE** (Instituto Brasileiro de Geografia e Estatística) through **CONCLA** (Comissão Nacional de Classificação).

CNAE is used by:
- **Receita Federal** — CNPJ registration (every Brazilian company has a CNAE code)
- **IBGE** — Economic surveys and statistics
- **State/Municipal agencies** — Tax classification, permits, licensing
- **Banks/Insurance** — Risk assessment and industry classification

## Hierarchy

CNAE has **5 hierarchical levels**, from broad to specific:

```
Seção (Section)           → 21 items   → Letter code (A-U)
  └─ Divisão (Division)   → 87 items   → 2-digit code (01-99)
    └─ Grupo (Group)      → 285 items  → X.X format (01.1)
      └─ Classe (Class)   → 673 items  → XX.XX-X format (01.11-3)
        └─ Subclasse       → ~1300 items → XXXX-X/XX format (0111-3/01)
```

### Level Details

#### Seção (Section) — 21 items
The broadest level. Single letter code.

| Code | Description |
|------|-------------|
| A | Agricultura, pecuária, produção florestal, pesca e aquicultura |
| B | Indústrias extrativas |
| C | Indústrias de transformação |
| D | Eletricidade e gás |
| E | Água, esgoto, atividades de gestão de resíduos e descontaminação |
| F | Construção |
| G | Comércio; reparação de veículos automotores e motocicletas |
| H | Transporte, armazenagem e correio |
| I | Alojamento e alimentação |
| J | Informação e comunicação |
| K | Atividades financeiras, de seguros e serviços relacionados |
| L | Atividades imobiliárias |
| M | Atividades profissionais, científicas e técnicas |
| N | Atividades administrativas e serviços complementares |
| O | Administração pública, defesa e seguridade social |
| P | Educação |
| Q | Saúde humana e serviços sociais |
| R | Artes, cultura, esporte e recreação |
| S | Outras atividades de serviços |
| T | Serviços domésticos |
| U | Organismos internacionais e outras instituições extraterritoriais |

#### Divisão (Division) — 87 items
Two-digit code within a section.

Example: Section A contains:
- `01` — Agricultura, pecuária e serviços relacionados
- `02` — Produção florestal
- `03` — Pesca e aquicultura

#### Grupo (Group) — 285 items
One decimal point format (XX.X).

Example: Division 01 contains:
- `01.1` — Produção de lavouras temporárias
- `01.2` — Horticultura e floricultura
- `01.3` — Produção de lavouras permanentes

#### Classe (Class) — 673 items
Format: XX.XX-X (two digits, dot, two digits, dash, check digit).

Example: Group 01.1 contains:
- `01.11-3` — Cultivo de cereais
- `01.12-1` — Cultivo de algodão herbáceo e de outras fibras de lavoura temporária
- `01.13-0` — Cultivo de cana-de-açúcar

#### Subclasse — ~1300 items
Format: XXXX-X/XX (most granular, used by Receita Federal for CNPJ).

Example: Class 01.11-3 contains:
- `0111-3/01` — Cultivo de arroz
- `0111-3/02` — Cultivo de milho
- `0111-3/03` — Cultivo de trigo
- `0111-3/99` — Cultivo de outros cereais não especificados anteriormente

## Versions

CNAE has gone through several revisions:

| Version | Year | Notes |
|---------|------|-------|
| CNAE (original) | 1994 | First version |
| CNAE 1.0 | 2002 | First major revision |
| CNAE-Fiscal 1.0 | 2003 | Subclass level added for tax purposes |
| CNAE-Fiscal 1.1 | 2003 | Update to fiscal version |
| CNAE 2.0 | 2007 | Major revision (current for Classes) |
| CNAE 2.0 Subclasses | 2007 | Subclass level for 2.0 |
| CNAE 2.1 Subclasses | 2013 | Subclass updates |
| CNAE 2.2 Subclasses | 2018 | Subclass updates |
| **CNAE 2.3 Subclasses** | **2024+** | **Latest version** |
| CNAE-Domiciliar | varies | Simplified version for household surveys |

### Key Difference: Classes vs Subclasses

- **Classes (CNAE 2.0):** 673 entries. Used for statistical classification. Less granular.
- **Subclasses (CNAE 2.3):** ~1300 entries. Used by Receita Federal for CNPJ. Most granular.

**Important:** Class versions (2.0) and Subclass versions (2.1, 2.2, 2.3) evolve independently. CNAE 2.0 Classes is still the current Class-level structure; only subclasses have been updated to 2.3.

## Code Format Patterns

```
Seção:     /^[A-U]$/           → e.g., "A"
Divisão:   /^\d{2}$/            → e.g., "01"
Grupo:     /^\d{2}\.\d$/        → e.g., "01.1"
Classe:    /^\d{2}\.\d{2}-\d$/  → e.g., "01.11-3"
Subclasse: /^\d{4}-\d\/\d{2}$/  → e.g., "0111-3/01"
```

## References

- [IBGE CONCLA — Official Site](https://cnae.ibge.gov.br/)
- [CNAE Downloads](https://cnae.ibge.gov.br/classificacoes/download-concla.html)
- [CNAE Online Search](https://cnae.ibge.gov.br/)
- [Receita Federal — CNPJ/CNAE](https://www.gov.br/receitafederal/)
