# Skill — Generate Demand

## Objetivo

Converter uma demanda em texto livre (curta, direta, possivelmente desorganizada) em um arquivo de demanda estruturado com base no template mais adequado.

## Entrada esperada

- Texto de demanda em linguagem natural.
- Pode vir sem formatação, sem seções e com lacunas.

## Gatilhos de ativação

Ativar esta skill quando o prompt começar com padrões como:

- `Elabore uma demanda ...`
- `Faça uma demanda ...`

Também ativar para variações equivalentes (ex.: “crie uma demanda”, “estruture esta demanda”).

## Modo de acionamento no chat (anexo único)

Esta skill foi escrita para ser anexada **sozinha** no chat.

Ao receber a ativação, a IA **MUST** considerar automaticamente como referências de contexto:

- `_docs/ia-context/README.md`
- `_docs/ia-context/core/rules.md`
- `_docs/ia-context/project-overlay/rules.md`
- `_docs/ia-context/project-overlay/context.md`
- `_docs/ia-context/core/workflow.md`
- `_docs/ia-context/project-overlay/workflow-overrides.md`
- `_docs/ia-context/core/output-contracts.md`
- `_docs/ia-context/core/templates/README.md`

Essas referências devem ser copiadas para a seção `Contexto de execução da IA` no arquivo de demanda gerado.

## Saída obrigatória

- Gerar **um novo arquivo Markdown** em `agent-workspace/planejamento/`.
- Não editar os templates em `core/templates/*`.
- Nome sugerido para o arquivo: `demanda-YYYYMMDD-HHMM-slug.md`.
- O arquivo final **MUST** conter a seção `Contexto de execução da IA` preenchida com referências válidas.

### Referências obrigatórias no arquivo gerado (projeto atual)

- `_docs/ia-context/README.md`
- `_docs/ia-context/core/rules.md`
- `_docs/ia-context/project-overlay/rules.md`
- `_docs/ia-context/project-overlay/context.md`
- `_docs/ia-context/core/workflow.md`
- `_docs/ia-context/project-overlay/workflow-overrides.md`
- `_docs/ia-context/core/output-contracts.md`

## Seleção de template por complexidade

Mapeamento padrão:

1. `core/templates/01-simple.md`
   - Tarefa rápida, baixo risco, objetivo único, pouca ambiguidade.
2. `core/templates/02-ultra-compact.md`
   - Tarefa direta com escopo claro e poucos arquivos-alvo.
3. `core/templates/03-compact.md`
   - Bugfix/melhoria pequena com necessidade de critérios de aceite e suposições.
4. `core/templates/04-full.md`
   - Demanda complexa, multi-etapas, integração entre módulos ou maior risco de regressão.

Regra de fallback:

- Em caso de dúvida entre dois níveis, escolher o mais completo entre eles.

## Processo de transformação

1. Ler a demanda bruta e extrair intenção principal.
2. Identificar sinais de complexidade (escopo, risco, dependências, quantidade de módulos, impacto em contrato público).
3. Selecionar template conforme mapeamento.
4. Preencher o template preservando o sentido original da demanda.
5. Preencher a seção `Contexto de execução da IA` com as referências obrigatórias do projeto.
6. Quando faltar informação crítica, explicitar em `Registro de suposições`.
7. Manter linguagem objetiva e verificável.
8. Salvar o arquivo final em `agent-workspace/planejamento/`.

## Ajuste em caso de reuso em outro projeto

- Manter os templates neutros (com placeholders em `Contexto de execução da IA`).
- Adaptar apenas as referências preenchidas pela skill para os paths locais do projeto alvo.

## Regras de qualidade

- Não inventar requisitos não mencionados.
- Não expandir escopo com melhorias paralelas.
- Manter critérios de aceite testáveis.
- Preservar intenção de negócio da demanda original.
- Garantir que o arquivo final seja auto-suficiente para execução pela IA (sem depender de contexto implícito).

## Formato de resposta ao finalizar

- Informar o template escolhido e o motivo.
- Informar o caminho do arquivo gerado.
- Informar as referências de contexto aplicadas.
- Informar suposições aplicadas (se houver).
