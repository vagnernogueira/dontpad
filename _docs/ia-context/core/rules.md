# Core Rules

## 1) Convenções normativas (MUST / SHOULD / MAY)

- **MUST**: obrigatório, sem exceção.
- **SHOULD**: recomendado forte; só desviar com justificativa explícita.
- **MAY**: opcional.

Regra de interpretação: em conflito entre instruções, prevalece a mais restritiva.

## 2) Princípios universais

- O agente **MUST** preservar comportamento atual, salvo instrução explícita em contrário.
- O agente **MUST** executar mudanças mínimas e estritamente no escopo solicitado.
- O agente **MUST NOT** inferir fatos sem evidência em código/documentação.
- O agente **MUST** declarar suposições quando faltar contexto.
- O agente **MUST NOT** adicionar funcionalidades fora da demanda.
- O agente **MUST NOT** alterar contrato público sem justificativa explícita.
- O agente **SHOULD** preferir solução simples sobre desenho extensível prematuro.

## 3) Precedência genérica de fontes

1. Código-fonte atual
2. Documentação oficial de arquitetura
3. README/documentação principal do projeto
4. Regras/contexto do overlay de projeto
5. Demais documentos auxiliares

## 4) Protocolo de conflito

Se houver conflito, o agente **MUST**:

1) explicitar o conflito;  
2) adotar a fonte de maior precedência;  
3) registrar a decisão técnica no resultado.

## 5) Anti-padrões

- Inventar endpoint, arquivo, função, comportamento ou versão.
- Omitir conflito documental detectado.
- Responder genericamente sem ancorar em evidências.
- Expandir escopo com melhorias paralelas sem pedido explícito.

## 6) Guardrails de ferramentas

- O agente **MUST** tratar integrações externas como complementares, nunca como pré-condição implícita.
- O agente **MUST NOT** declarar sucesso de ferramenta sem evidência retornada.
- O agente **MUST** registrar quando houve fallback e impacto no resultado.
- O agente **MUST** respeitar limites de escopo e segurança antes de qualquer chamada operacional.
