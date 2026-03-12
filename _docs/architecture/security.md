# Segurança e Controle de Acesso

## Escopo

Consolida decisões e práticas de segurança aplicáveis ao editor colaborativo, APIs administrativas e conexões WebSocket.

## Donos

- Time de Desenvolvimento DontPad

## Áreas cobertas

- proteção por senha de documento;
- senha mestre administrativa;
- autorização de handshake WebSocket;
- cuidados de rendering Markdown/XSS;
- limitações e riscos conhecidos.

## Lock por documento

- senha nunca é armazenada em texto puro;
- cada documento usa `salt` exclusivo;
- hash via `crypto.scryptSync`;
- comparação com `timingSafeEqual`.

## Senha mestre

- controlada por `DOCUMENTS_MASTER_PASSWORD`;
- protege operações administrativas (`/api/documents*`);
- pode atuar como bypass administrativo em fluxos de lock.

## WebSocket protegido

- para documento lockado, handshake exige `password`;
- senha inválida encerra conexão com `4403`.

## API administrativa

- endpoints exigem header `x-docs-password` válido;
- respostas padronizadas:
  - `400` payload inválido;
  - `403` acesso negado;
  - `500` erro interno.

## Rendering e XSS

- evitar injeção direta de HTML não confiável;
- preferir escaping padrão de Vue (`{{ }}`) para conteúdo de usuário;
- revisar pipeline de conversão Markdown/HTML sempre que houver mudança de biblioteca.

## Armazenamento no frontend

- `localStorage` permitido para preferências não sensíveis;
- credenciais/senhas não devem ser persistidas no navegador.

## Limitações conhecidas

- lock metadata local em JSON não é ideal para multi-réplica;
- ausência de rate limiting nativo nas rotas;
- observabilidade de segurança pode evoluir (auditoria/correlação de eventos).

## Quando atualizar

Atualizar este módulo ao alterar:

- estratégia de hash/autorização;
- contratos de autenticação HTTP/WS;
- políticas de armazenamento de credenciais;
- mitigação de XSS/abuso.
