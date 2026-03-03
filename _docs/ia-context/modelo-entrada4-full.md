# Modelo de Entrada FULL — Contexto v2.1 (Dontpad)

> Referência obrigatória: `_docs/ia-context/contexto.md`

Use este modelo para demandas complexas, multi-etapas, refatorações amplas ou quando houver risco de regressão arquitetural.

## Instruções para IA

1. Considere como fonte principal o arquivo `_docs/ia-context/contexto.md`.
2. Siga precedência de fontes e checklist anti-alucinação definidos no contexto.
3. Em caso de conflito entre documentos, explicite o conflito e registre a decisão adotada.
4. Limite-se ao escopo desta demanda; não implemente extras.
5. Estruture a resposta conforme o tipo de saída solicitado.

## Demanda

[descreva em 1-3 parágrafos o problema e o resultado esperado]

## Objetivo

[resultado esperado de negócio/técnico]

## Escopo

- Incluir:
- Excluir:

## Restrições

- [ex.: preservar API pública atual]
- [ex.: não alterar UX existente]
- [ex.: manter compatibilidade com comportamento atual]

## Contexto técnico adicional

- [dependências, decisões anteriores, links de docs internos]

## Arquivos ou módulos suspeitos

- [path1]
- [path2]
- [path3]

## Critérios de aceite

- [critério funcional 1]
- [critério funcional 2]
- [critério técnico 1]
- [critério técnico 2]

## Definition of Done (Passa/Falha)

- [ ] Escopo solicitado concluído sem funcionalidades extras.
- [ ] Critérios funcionais e técnicos validados com evidência objetiva.
- [ ] Impactos e riscos documentados no retorno.
- [ ] Compatibilidade com comportamento atual preservada (ou exceção justificada).

## Assumptions log

- Assunção: [premissa adotada]
  Risco: [impacto se a premissa falhar]
  Validação esperada: [teste/evidência para confirmar]

## Riscos conhecidos

- [risco 1]
- [risco 2]

## Tipo de saída esperada

[análise | plano | implementação | revisão]

## Formato de saída esperado

No retorno do prompt:

- Resumo objetivo da entrega.

No arquivo markdown de saída na pasta `agent-workspace/execucao`:

- Resumo da entrega
- Decisões técnicas e trade-offs
- Arquivos impactados
- Riscos e mitigação
- Próximos passos
