---
name: documentation-blueprint
description: >-
  Estrutura, revisa e gerencia documentação técnica por blueprint. Use quando
  o usuário pedir para bootstrapar docs, auditar conformidade documental ou
  abrir, evoluir ou encerrar ondas de documentação, inclusive quando a tarefa
  vier descrita como organizar, padronizar ou revisar a documentação do projeto.
---

# Documentation Blueprint

## Quando usar esta skill

Use esta skill quando a demanda envolver documentação técnica do projeto e for necessário:

- estruturar documentação inicial (bootstrap),
- revisar conformidade, qualidade e consistência de links (review),
- gerenciar evolução por ondas (wave-management).

Gatilhos comuns:

- `estruture a documentação do projeto`
- `revisar docs conforme blueprint`
- `abrir/fechar nova onda de documentação`
- variações equivalentes.

## Required project references

Ao ativar esta skill, considerar como referências obrigatórias:

- `_docs/ia-context/README.md`
- `_docs/ia-context/core/rules.md`
- `_docs/ia-context/project-overlay/rules.md`
- `_docs/ia-context/core/workflow.md`
- `_docs/ia-context/project-overlay/workflow-overrides.md`
- `_docs/ia-context/core/output-contracts.md`
- `_docs/ia-context/core/skills/documentation-blueprint/blueprints/blueprint-doc.md`
- `_docs/ia-context/core/skills/documentation-blueprint/blueprints/blueprint-doc-README-model.md`
- `_docs/ia-context/core/skills/documentation-blueprint/blueprints/blueprint-doc-ARCHITECTURE-model.md`
- `_docs/ia-context/core/skills/documentation-blueprint/blueprints/blueprint-doc-escopo-model.md`
- `_docs/ia-context/core/skills/documentation-blueprint/blueprints/blueprint-doc-ata-model.md`
- `_docs/ia-context/core/skills/documentation-blueprint/blueprints/blueprint-doc-adr-model.md`

## Operating modes

### 1) bootstrap

Objetivo: criar ou normalizar a estrutura documental mínima do projeto segundo blueprint.

Escopo mínimo:

- validar presença de `README.md` e `_docs/ARCHITECTURE.md`;
- validar presença de `_docs/assets/`;
- validar existência de onda inicial `1-mvp/` com subestrutura esperada;
- criar artefatos ausentes usando os modelos de blueprint.

### 2) review

Objetivo: auditar conformidade documental e propor/aplicar ajustes objetivos.

Validações mínimas:

- estrutura obrigatória de pastas e arquivos;
- aderência a nomenclatura de ondas `{numero}-{slug}`;
- consistência de links internos e âncoras;
- completude dos campos essenciais nos templates;
- alinhamento com regras de Markdown/GFM do blueprint.

Saída mínima:

- relatório com não conformidades por severidade (`alta`, `média`, `baixa`);
- plano de correção priorizado;
- patch sugerido ou aplicado quando autorizado no fluxo.

### 3) wave-management

Objetivo: abrir, evoluir ou encerrar uma onda de documentação preservando rastreabilidade.

Operações:

- abrir nova onda incremental (`N-slug`) com estrutura padrão;
- atualizar `README.md` com tabela de ondas;
- registrar decisões em `decisoes/` via modelo ADR;
- registrar reuniões e ajustes com padrão de nomenclatura;
- manter histórico cronológico sem reescrever ondas passadas.

## Output contract

Esta skill MUST retornar saída no padrão de `_docs/ia-context/core/output-contracts.md`, com:

1. Análise técnica
2. Plano de implementação
3. Implementação
4. Revisão e refatoração
5. Checklist anti-alucinação

Adicionalmente, incluir seção `Conformidade Blueprint` contendo:

- itens conformes;
- itens não conformes;
- ações pendentes.

## Tooling contract

Toda chamada de ferramenta MUST registrar:

- entrada com `capability`, `intent`, `input`;
- saída com `status`, `evidence`, `notes`;
- fallback documentado quando capacidade não estiver disponível.

Esta skill MUST NOT depender de um provedor específico de IA ou IDE. O comportamento deve ser descrito por capacidades (ex.: `file.search`, `code.read`, `code.write`, `docs.read`, `terminal.run`) e não por nomes de ferramentas proprietárias.

## Precedence and conflicts

Em caso de conflito entre documentação:

1. código-fonte atual;
2. `_docs/ARCHITECTURE.md`;
3. `README.md`;
4. regras e workflow de `_docs/ia-context/*`;
5. blueprints em `_docs/ia-context/core/skills/documentation-blueprint/blueprints/*`.

Se o blueprint conflitar com fato observável no código, registrar exceção justificada no relatório e sugerir ajuste no documento.

## Steps

1. Detectar modo (`bootstrap`, `review` ou `wave-management`) a partir da demanda.
2. Inventariar estrutura documental atual com evidências.
3. Comparar estado atual com critérios do blueprint.
4. Gerar plano de ação mínimo e verificável.
5. Aplicar mudanças documentais estritamente dentro do escopo solicitado.
6. Validar links e consistência de nomenclatura.
7. Entregar relatório final no contrato de saída padrão.

## Quality rules

- Não inventar documentação inexistente; quando faltante, criar via template.
- Não alterar conteúdo técnico de código para “forçar conformidade”.
- Não expandir escopo além do modo solicitado.
- Manter linguagem objetiva e rastreável por arquivo.
- Sempre explicitar suposições e limitações.

## Final response format

- Modo executado + justificativa.
- Arquivos criados/alterados.
- Principais não conformidades encontradas (quando houver).
- Ações concluídas vs. pendentes.
- Próxima ação recomendada.
