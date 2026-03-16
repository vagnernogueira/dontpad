# Deploy e Operações

## Escopo

Documenta execução local, build, deploy conteinerizado, variáveis de ambiente e recomendações de publicação em produção.

## Donos

- Time de Desenvolvimento DontPad

## Execução local

- `make dev-backend` para API/WS;
- `make dev-frontend` para SPA;
- `make run` / `make stop` para stack conteinerizada.

## Docker Compose

Serviços principais:

- `backend`: expõe `127.0.0.1:1234`, usa volume `yjs_data`, recebe `PORT` e `DOCUMENTS_MASTER_PASSWORD`;
- `frontend`: expõe `127.0.0.1:8080`, depende do backend, injeta `VITE_BACKEND_HTTP_URL` e `VITE_BACKEND_WS_URL`.

## Variáveis de ambiente críticas

- `DOCUMENTS_MASTER_PASSWORD`
- `VITE_BACKEND_HTTP_URL`
- `VITE_BACKEND_WS_URL`

Notas:

- `DOCUMENTS_MASTER_PASSWORD` é usada apenas pelo backend; o frontend não embute senha de acesso no build;
- recomendado usar senhas fortes e não reutilizar entre ambientes.

## Build backend

- Docker multi-stage com `node:20-alpine`;
- estágio builder compila TypeScript;
- estágio runtime instala dependências de produção e executa `npm start`.

## Proxy reverso

Recomendado publicar frontend e backend via proxy para TLS e roteamento simples.

Exemplo (Caddy):

```caddyfile
dontpad.seusite.com {
  reverse_proxy localhost:8080
}

dontpadsrv.seusite.com {
  reverse_proxy localhost:1234
}
```

## Checklist operacional

- validar URLs HTTP/WS de produção;
- validar handshake WS em documento lockado;
- validar persistência em volume `yjs_data`;
- validar acesso ao Explorer com senha mestre;
- validar export Markdown/PDF em ambiente final.

## Quando atualizar

Atualizar este módulo ao alterar:

- topologia de deploy/compose;
- contratos de variáveis de ambiente;
- passos de run/build;
- estratégia de proxy/domínios.
