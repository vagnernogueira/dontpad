# Deploy e Operações

## Escopo

Documenta execução local, build, deploy conteinerizado, variáveis de ambiente, publicação em produção e os artefatos estáticos relevantes do frontend, incluindo PWA e tipografia local.

## Donos

- Time de Desenvolvimento DontPad

## Execução local

- `make build` executa os testes dos pacotes, recompõe as imagens e produz o bundle do frontend com `manifest.webmanifest`, `sw.js`, ícones PWA e fontes `.woff2` locais;
- `make dev-backend` para API/WS;
- `make dev-frontend` para SPA;
- `make run` / `make stop` para stack conteinerizada.

## Docker Compose

Serviços principais:

- `backend`: expõe `127.0.0.1:1234`, usa volume `yjs_data`, recebe `PORT` e `DOCUMENTS_MASTER_PASSWORD`;
- `frontend`: expõe `127.0.0.1:8080`, depende do backend, injeta `VITE_BACKEND_HTTP_URL` e `VITE_BACKEND_WS_URL`, serve o bundle estático com `manifest.webmanifest`, `sw.js`, ícones PWA e tipografia local, e encaminha `/api` e acessos `?raw` para o backend.

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

## Build frontend

- Docker multi-stage com `node:20-alpine` no builder e `nginx:alpine` no runtime;
- estágio builder recebe `VITE_BACKEND_HTTP_URL` e `VITE_BACKEND_WS_URL` como `build args` e executa `npm ci --legacy-peer-deps`;
- `npm run build` gera o bundle Vite com `manifest.webmanifest`, `sw.js`, ícones públicos e assets tipográficos `.woff2` locais;
- estágio runtime copia `dist/` para o Nginx e aplica configuração de SPA com `try_files ... /index.html`, proxy de `/api` para o backend e bypass de `?raw` para o serviço Node.

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
- validar resposta de `manifest.webmanifest` e `sw.js` no frontend publicado;
- validar que o HTML servido pelo frontend não referencia `fonts.googleapis.com` nem `fonts.gstatic.com`;
- validar que o CSS publicado referencia `.woff2` locais emitidos em `dist/assets`;
- validar handshake WS em documento lockado;
- validar persistência em volume `yjs_data`;
- validar acesso ao Explorer com senha mestre;
- validar export Markdown/PDF em ambiente final.

## Quando atualizar

Atualizar este módulo ao alterar:

- topologia de deploy/compose;
- contratos de variáveis de ambiente;
- passos de run/build;
- artefatos estáticos servidos pelo frontend (manifest, service worker, ícones PWA, fontes locais);
- estratégia de proxy/domínios.
