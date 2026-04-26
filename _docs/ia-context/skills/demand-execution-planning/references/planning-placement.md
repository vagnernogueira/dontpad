# Planning Placement Guide

Use este guia quando houver dúvida sobre onde inserir ou revisar a seção
`Planejamento da execução`.

## Mapeamento por template

| Template | Sinais mais fortes | Exemplo comparativo | Regra de posicionamento | Profundidade sugerida |
| --- | --- | --- | --- | --- |
| `simple` | `## Instruções`, `## Demanda`, sem `## Objetivo` | `generate-demand/exemplos/demanda-20260418-0116-limpeza-filtro-explorer.md` | Inserir depois de `## Demanda` e antes de `## Sugestão de commit final` | 3 etapas curtas |
| `ultra-compact` | `## Entrada mínima` com lista curta de campos | `generate-demand/exemplos/demanda-20260318-2130-header-editor-para-componente.md` | Não quebrar `## Entrada mínima`; concluir todos os campos (`Demanda`, `Objetivo`, `Escopo`, `Arquivos-alvo`, `Critérios de aceite`, `Tipo de saída`) e inserir o planejamento depois desse bloco, antes de `## Sugestão de commit final` | 3 etapas curtas |
| `compact` | `## Objetivo`, `## Escopo`, `## Arquivos ou módulos-alvo`, `## Critérios de aceite` | `generate-demand/exemplos/demanda-20260415-1825-explorer-selecao-unica-checkbox.md` | Se a seção existir, manter a posição e revisar o conteúdo. Se não existir, inserir depois de `[análise \| implementação \| revisão]` e antes de `## Memorial de execução` | 3 ou 4 etapas |
| `full` | `## Restrições`, `## Contexto técnico adicional`, `## Riscos conhecidos` | `generate-demand/exemplos/demanda-20260416-0321-backup-geral-explorer.md` | Se a seção existir, manter a posição e revisar o conteúdo. Se não existir, inserir depois de `[análise \| implementação \| revisão]` e antes de `## Memorial de execução` | 4 a 6 etapas |

## Regra de integridade do bloco atual

Antes de inserir `## Planejamento da execução`, verificar se a demanda usa um
bloco top-level como contêiner único de campos.

- Se usar, não interromper esse bloco no meio.
- Inserir a nova seção apenas depois do último campo irmão desse bloco.
- Em `ultra-compact`, isso significa que `Critérios de aceite` e `Tipo de
	saída` continuam dentro de `## Entrada mínima`, e o planejamento entra como
	nova seção logo depois.

## Regra de fallback para demandas customizadas

Se o documento não corresponder claramente a nenhum template:

1. Se existir `## Memorial de execução`, inserir imediatamente antes dessa seção.
2. Senão, se existir `### Sugestão de commit final`, inserir imediatamente antes dela.
3. Senão, se existir `## Tipo de saída` ou equivalente, inserir imediatamente antes dela.
4. Senão, inserir após a descrição principal da demanda, antes do fechamento do documento.

## Heurística por tipo de saída

| Tipo de saída | Viés do planejamento |
| --- | --- |
| `análise` | leitura de contexto, checagem de hipóteses, síntese baseada em evidência |
| `revisão` | inspeção do estado atual, ajuste pontual, revalidação do artefato |
| `implementação` | mapeamento do fluxo atual, mudança mínima, validação funcional/técnica |
| `plano` | decomposição de fases, dependências e checkpoints |

## Checklist rápido antes de salvar

- A seção usa exatamente o título `## Planejamento da execução`.
- O plano respeita o escopo já definido.
- Existe uma etapa final de validação coerente com os critérios de aceite.
- O número de etapas é proporcional à complexidade da demanda.
- O planejamento não quebrou um bloco estrutural do template no meio.
- Quando a demanda já nomeia arquivos, componentes, serviços ou eventos, o
	planejamento reaproveita pelo menos parte desses nomes.
- O restante da demanda foi preservado sem reescrita desnecessária.