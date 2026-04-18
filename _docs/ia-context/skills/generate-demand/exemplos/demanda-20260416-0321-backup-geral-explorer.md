# Template FULL

## Contexto de execução da IA

- Pacote de contexto: _docs/ia-context/README.md
- Regras globais: _docs/ia-context/core/rules.md
- Regras do projeto: _docs/ia-context/project-overlay/rules.md
- Contexto do projeto: _docs/ia-context/project-overlay/context.md
- Workflow base: _docs/ia-context/core/workflow.md
- Contrato de saída: _docs/ia-context/core/output-contracts.md

## Demanda

Implementar uma funcionalidade de backup geral no Explorer. A interface deve ganhar um novo botão na toolbar para acionar o backup e, ao clicar nele, a aplicação deve solicitar ao backend a geração de um arquivo `.zip` com todos os documentos disponíveis em formato Markdown.

O backup precisa preservar documentos com path, como `me/todo`, dentro da estrutura interna do zip. Documentos vazios devem ser excluídos do backup. A funcionalidade deve seguir o padrão de acesso já usado no Explorer, respeitando a proteção por senha mestra e sem alterar outros fluxos de gestão de documentos.

## Objetivo

Permitir que o usuário exporte, a partir do Explorer, um backup completo dos documentos não vazios em um único arquivo `.zip`, preservando a hierarquia de paths e mantendo a experiência coerente com as demais ações do módulo.

## Escopo

- Incluir:
  - Novo botão de backup geral na toolbar do Explorer;
  - Nova rota/serviço na API para gerar e servir o zip para download;
  - Exportação de cada documento como arquivo Markdown dentro do zip;
  - Preservação da estrutura de path dos documentos no zip;
  - Exclusão de documentos vazios do backup;
  - Testes para o backend e para a integração do frontend com a nova ação.
- Excluir:
  - Alterações no editor principal fora do Explorer;
  - Mudanças no formato de armazenamento dos documentos;
  - Novos formatos de exportação além de `.zip` com Markdown;
  - Qualquer redesign visual do Explorer além do botão necessário.

## Restrições

- Preservar o comportamento atual das ações existentes no Explorer.
- Não alterar o contrato público já usado pelas rotas atuais sem necessidade explícita.
- Manter o backup coerente com a autenticação por senha mestra já exigida nas ações administrativas.
- Não incluir documentos vazios no zip, mesmo que existam no catálogo do Explorer.

## Contexto técnico adicional

- O Explorer já possui ações de download por documento e um serviço de API centralizado no frontend.
- O backend já expõe leitura de conteúdo por documento e listagem de documentos, o que pode ser reaproveitado para compor o backup.
- Documentos com path já são tratados no frontend para navegação, então a exportação deve manter essa mesma estrutura no zip.
- A implementação deve evitar duplicação desnecessária de lógica entre frontend e backend.

## Arquivos ou módulos suspeitos

- frontend/src/components/Explorer.vue
- frontend/src/services/document-api.ts
- frontend/src/services/export.ts
- backend/src/server.ts
- backend/src/sync.ts
- backend/src/__tests__/integration/api.integration.test.ts
- backend/src/__tests__/unit/document-content.unit.test.ts
- frontend/src/__tests__/unit/document-api.test.ts

## Planejamento da execução

> Planejamento pendente. Use a skill demand-execution-planning para preencher ou revisar esta seção.

## Critérios de aceite

- Existe um novo botão no Explorer para acionar o backup geral.
- O clique no botão dispara a geração e o download de um arquivo `.zip` via API.
- O zip contém todos os documentos não vazios como arquivos Markdown.
- Documentos com path, como `me/todo`, aparecem no zip preservando a hierarquia interna de diretórios.
- Documentos vazios não são incluídos no backup.
- Testes cobrem o fluxo principal, incluindo composição do zip, exclusão de vazios e integração do frontend com a nova ação.

## Critérios de conclusão (Passa/Falha)

- [ ] Escopo solicitado concluído sem desvios.
- [ ] Critérios de aceite comprovados com resultado objetivo.
- [ ] Sem alteração de contrato público não autorizada.

## Registro de suposições

- Assunção: o backup deve seguir a mesma proteção por senha mestra já usada nas ações administrativas do Explorer.
  Risco: se o fluxo esperado for público ou usar outra credencial, a API e a UI precisarão de ajuste.
  Validação esperada: teste de integração confirmando o comportamento de autenticação da nova rota.
- Assunção: cada documento exportado será convertido em um arquivo `.md` dentro do zip, usando o path do documento como caminho interno.
  Risco: se houver regra diferente de nomeação, a estrutura do zip pode ficar incompatível com a expectativa do usuário.
  Validação esperada: teste com documento raiz e documento aninhado, como `me/todo`, verificando os nomes gerados.

## Riscos conhecidos

- Geração de zip no backend pode exigir atenção a uso de memória se houver muitos documentos.
- Normalização de paths pode introduzir colisões ou nomes inválidos se não for tratada de forma consistente.
- Excluir documentos vazios exige critério claro de vazio para evitar omissões indevidas.

## Tipo de saída esperada

implementação

## Memorial de execução

> Memorial pendente. Ao final da execução ou atendimento da demanda, adicione a descrição da execução, a lista de arquivos alterados, os impactos identificados ou esperados, as validações executadas e as validações recomendadas.

## Sugestão de commit final

> Mensagem de commit pendente. Use a skill conventional-commits para sugerir a mensagem final.