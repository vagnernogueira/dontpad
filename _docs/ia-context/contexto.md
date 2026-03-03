# Contexto v2.1 — Base Machine-First para Prompts de IA

Este arquivo é a **base padrão** para prompts de demanda técnica.

**Objetivo:** Maximizar precisão operacional de agentes de IA, reduzir ambiguidade, custo de contexto e alucinação; e aumentar previsibilidade de execução em demandas no projeto.

*Público-alvo:* Este documento é direcionado a **agentes e ferramentas de IA** (não a usuário final).

---

## 1) Convenções normativas (MUST / SHOULD / MAY)

Para reduzir ambiguidades, aplicar estas palavras com significado fixo:

- **MUST**: obrigatório, sem exceção.
- **SHOULD**: recomendado forte; só desviar com justificativa explícita.
- **MAY**: opcional.

Regra de interpretação: em conflito entre instruções deste documento, prevalece a regra mais restritiva.

---

## 2) Escopo e princípios obrigatórios

### Escopo do projeto (baseline)

- Produto: editor colaborativo de Markdown em tempo real.
- Arquitetura: SPA Vue + backend HTTP/WS com sincronização CRDT (Yjs).
- Núcleo funcional: colaboração, lock por senha, exportação e plugins CodeMirror.

### Princípios (machine-first)

- O agente **MUST** preservar comportamento atual, salvo instrução explícita em contrário.
- O agente **MUST** executar mudanças mínimas e estritamente no escopo solicitado.
- O agente **SHOULD** priorizar mecanismos nativos do CodeMirror quando aplicável.
- O agente **MUST NOT** inferir fatos sem evidência em código/documentação canônica.
- O agente **MUST** declarar suposições quando faltar contexto.

---

## 3) Fontes canônicas e precedência (anti-conflito)

Ordem obrigatória de precedência:

1. Código-fonte atual (verdade operacional)
2. `_docs/ARCHITETURE.md`
3. `README.md`
4. `_docs/ia-context/contexto.md`
5. Demais documentos auxiliares em `_docs/`

### Protocolo de conflito entre fontes

Se houver conflito, o agente **MUST**:

1) explicitar o conflito;  
2) adotar a fonte de maior precedência;  
3) registrar a decisão técnica no resultado.

---

## 4) Baseline factual ancorado no estado atual

> Esta seção deve ser tratada como âncora anti-alucinação para prompts operacionais.

### Stack principal

- Frontend: Vue 3, TypeScript, Vite, Tailwind, CodeMirror 6, Yjs.
- Backend: Node.js, TypeScript, Express, WebSocket (`ws`), Yjs.

### Persistência e sincronização

- Persistência colaborativa via `y-leveldb` (LevelDB local).
- Lock de documentos em `backend/db/document-locks.json`.
- Sincronização em tempo real via `y-websocket`.

### APIs existentes

- `GET /api/health`
- `GET /api/documents` (protegida por `x-docs-password`)
- `GET /api/document-lock`
- `POST /api/document-lock`
- `DELETE /api/document-lock`
- `POST /api/document-access`

### Regras de UI/Frontend existentes

- Ícones: preferir `lucide-vue-next`.
- Evitar SVG inline em novos componentes.
- Estrutura modular em `cm-commands`, `cm-extensions`, `cm-plugins`, `cm-utils`, `services`.

---

## 5) Protocolo operacional determinístico

### Sequência padrão de execução

1. Entender demanda e extrair objetivo, escopo, restrições e critérios de aceite.
2. Verificar fontes canônicas na ordem de precedência.
3. Identificar lacunas críticas.
4. Decidir: perguntar ou seguir com suposição segura.
5. Executar solução mínima no escopo.
6. Reportar decisão, impacto, riscos e próximos passos.

### Quando perguntar vs quando seguir

O agente **MUST** perguntar (até 3 perguntas objetivas) quando existir lacuna crítica que altere arquitetura, contrato público ou comportamento principal.

O agente **MAY** seguir com suposição segura quando:

- a decisão não muda contrato público;
- a decisão é reversível com baixo custo;
- a solução mantém comportamento padrão existente.

### Critérios de bloqueio

O agente **MUST** bloquear implementação e solicitar clarificação quando:

- houver duas interpretações mutuamente exclusivas com impacto funcional relevante;
- faltar credencial/segredo/permite operacional indispensável;
- a mudança solicitada conflitar explicitamente com regra mandatória do projeto sem autorização para exceção.

---

## 6) Guardrails de escopo e anti-deriva

- O agente **MUST NOT** adicionar features fora da demanda.
- O agente **MUST NOT** refatorar módulos não relacionados sem necessidade comprovada.
- O agente **MUST NOT** alterar API pública sem justificativa explícita.
- O agente **SHOULD** preferir solução simples sobre desenho extensível prematuro.
- O agente **MUST** explicitar qualquer trade-off relevante adotado.

### Anti-padrões (não fazer)

- Inventar endpoint, arquivo, função, comportamento ou versão.
- Omitir conflito entre docs quando detectado.
- Responder genericamente sem ancorar em evidências do projeto.
- Expandir escopo com “melhorias paralelas” sem pedido explícito.

---

## 7) Contratos de saída

### Análise técnica

- Resumo da demanda (1–3 linhas)
- Evidências no projeto
- Opções com trade-offs
- Recomendação
- Riscos e mitigação

### Plano de implementação

- Objetivo por etapa
- Arquivos afetados
- Mudanças previstas
- Critérios de aceite
- Riscos

### Implementação

- O que foi alterado
- Arquivos modificados
- Impacto funcional esperado
- Validação recomendada ao solicitante

### Revisão/refatoração

- Problemas encontrados
- Melhorias aplicadas/propostas
- Compatibilidade/regressão potencial
- Próximos ajustes sugeridos

---

## 8) Checklist anti-alucinação (obrigatório)

Antes de concluir qualquer resposta:

- [ ] Usei a fonte de maior precedência disponível?
- [ ] Detectei e tratei conflitos documentais?
- [ ] Tudo que afirmei existe no código atual ou está marcado como proposta?
- [ ] Minhas suposições estão explícitas?
- [ ] Evitei extrapolar escopo?
- [ ] Defini critérios de aceite verificáveis?

---

## 9) Regras operacionais do projeto

- Trabalhar em etapas quando a demanda for multi-fase.
- Faça build/compile simples com npm no projeto ao final da implementação para verificar erros de sintaxe e resolvê-los, caso apareçam, antes da entrega final.
- Não execute a geração da imagem do projeto e testes de navegador, salvo solicitação explícita.
- Ao finalizar: entregar resumo objetivo, arquivos alterados, impactos e validações recomendadas.
