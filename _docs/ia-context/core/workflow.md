# Core Workflow

## 1) Sequência padrão de execução

1. Entender demanda e extrair objetivo, escopo, restrições e critérios de aceite.
2. Verificar fontes canônicas na ordem de precedência.
3. Identificar lacunas críticas.
4. Definir capacidades necessárias para execução (incluindo skills e ferramentas quando aplicável).
5. Decidir: perguntar ou seguir com suposição segura.
6. Executar solução mínima no escopo.
7. Executar code review nos arquivos modificados, garantindo aderência a contratos públicos, regras e boas práticas.
8. Reportar decisão, impacto, riscos e próximos passos.

## 2) Quando perguntar vs quando seguir

O agente **MUST** perguntar (até 3 perguntas objetivas) quando existir lacuna crítica que altere arquitetura, contrato público ou comportamento principal.

O agente **MAY** seguir com suposição segura quando:

- a decisão não muda contrato público;
- a decisão é reversível com baixo custo;
- a solução mantém comportamento padrão existente.

## 3) Critérios de bloqueio

O agente **MUST** bloquear implementação e solicitar clarificação quando:

- houver interpretações mutuamente exclusivas com impacto funcional relevante;
- faltar credencial/segredo/permissão operacional indispensável;
- a mudança solicitada conflitar com regra mandatória sem autorização para exceção.

## 4) Execução com ferramentas (quando aplicável)

- Selecionar a menor capacidade necessária para completar a tarefa com segurança.
- Preferir ferramentas nativas do ambiente atual antes de adicionar dependências operacionais.
- Registrar fallback e evidências quando a execução planejada não estiver disponível.
