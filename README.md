# Dontpad - Colaboração em texto, para todos.

Edição de texto em tempo real, sem cadastro, sem complicações. A ferramenta ideal para notas rápidas, snippets de código e colaboração instantânea.

Múltiplos usuários editando simultaneamente, com cursores coloridos e sincronização instantânea.

## Diferenciais

- **Simplicidade em primeiro lugar:** Focado na velocidade e facilidade de uso. Sem distrações, apenas o essencial.
- **Instantâneo:** Sem login, sem configuração. Apenas digite a URL e comece a usar imediatamente.
- **Sincronização Real-time:** Veja o cursor e as edições dos seus colegas enquanto eles digitam.
- **URLs Amigáveis:** Crie links fáceis de lembrar e compartilhar verbalmente.
- **Subdocumentos:** Organize conteúdo hierarquicamente usando barras na URL.
- **Salvamento Automático:** Nunca perca seu trabalho. Tudo é salvo localmente instantaneamente.
- **Markdown & Texto:** Suporte para formatação rica ou texto puro, como você preferir.

## Stack Tecnológica

Este projeto foi construído focado em ser o mais leve possível para rodar na sua própria infraestrutura (*On-Premises*).

- **Frontend:** Vue.js 3 (com Vite), Tailwind CSS e CodeMirror 6 (suporte poderoso a Markdown e edições colaborativas).
- **Backend:** Node.js com Express e WebSockets (`ws`).
- **Sincronização Integrada:** Resolvida usando o ecossistema [Yjs](https://yjs.dev/) (`y-websocket`, `y-codemirror.next`), garantindo colaboração por CRDT.
- **Banco de Dados:** LevelDB. Utilizado nativamente via pacote `y-leveldb`, armazenando o vetor de estados estruturados como arquivos no disco de forma extremamente veloz e sem a necessidade de um servidor de SGBD separado.
- **Infraestrutura:** Podman com Compose Files, garantindo que tudo possa rodar com um único comando.

## Convenções de Frontend

- **Ícones:** usar a biblioteca `lucide-vue-next` em todas as telas/componentes novos.
- **Evitar SVG inline:** não adicionar tags `<svg>` diretamente em templates Vue.
- **Consistência e manutenção:** ao precisar de um novo ícone, importar o componente correspondente da biblioteca em vez de criar SVG manual no template.

## Rodando Localmente (Desenvolvimento)

Para rodar este projeto em sua máquina durante o desenvolvimento:

1. Clone o repositório.
2. Na raiz do projeto, crie o arquivo de ambiente: `cp .env.example .env`
3. Defina uma senha forte em `VITE_HOME_DOCS_PASSWORD`.
4. Acesse a pasta do backend: `cd backend`
5. Instale as dependências: `npm install`
6. Inicie o servidor: `npm run dev`
7. Em outro terminal, acesse a pasta do frontend: `cd frontend`
8. Instale as dependências: `npm install`
9. Inicie o frontend: `npm run dev`

## Deploy On-Premises (Produção)

A principal justificativa deste projeto é ter um *dontpad on-premises*, onde os dados da sua equipe ou empresa ficam salvos no seu próprio servidor.

Para isso, providenciamos suporte nativo via **Podman**. Você não precisa instalar Node.js ou configurar bancos de dados.

### Requisitos
- Podman instalado no seu SO.
- `podman-compose` ou acesso via `Makefile`.

### Variáveis de ambiente (build da imagem frontend)
Crie um arquivo `.env` na raiz do projeto (mesmo nível do `docker-compose.yml`) com:

```bash
VITE_HOME_DOCS_PASSWORD=defina-uma-senha-forte
VITE_HOME_DOCS_SHORTCUT=Alt+R
VITE_BACKEND_HTTP_URL=https://dontpad.vagnernogueira.com
VITE_BACKEND_WS_URL=wss://dontpad.vagnernogueira.com/api
```

> Essas variáveis são injetadas no build da imagem frontend. Sem `VITE_HOME_DOCS_PASSWORD`, o build falha por segurança.

`VITE_BACKEND_HTTP_URL` e `VITE_BACKEND_WS_URL` definem explicitamente os endpoints do backend HTTP e WebSocket usados pelo frontend em produção. Em cenário com proxy único no domínio do frontend, use WebSocket com sufixo `/api`.

No backend, a variável `DOCUMENTS_MASTER_PASSWORD` é preenchida automaticamente via `docker-compose` com o valor de `VITE_HOME_DOCS_PASSWORD`. Essa senha mestre permite:

- autorizar a enumeração de todos os documentos na tela inicial;
- abrir documentos travados por senha (bypass administrativo).

### Documentos com senha (cadeado)

Na tela de edição, use o botão de cadeado na barra de ferramentas para definir/atualizar a senha do documento atual.

- após travar, novas aberturas do documento exigem senha;
- o desbloqueio aceita a senha do próprio documento ou a senha mestre de ambiente;
- as senhas de trava são armazenadas no backend e persistidas em `backend/db/document-locks.json`.

### Como iniciar o serviço

1. Digite no terminal raiz do projeto para criar as imagens e subir os containers:
   ```bash
   make run
   ```
2. **Setup do Reverse Proxy (Recomendado):**
   Como o frontend rodará na porta `8080` e o backend WebSocket na porta `1234`, é altamente recomendável usar um servidor Web (como o Nginx ou Caddy) para expor a aplicação através de um domínio.
   
   Exemplo de `/etc/caddy/Caddyfile`:
   ```caddyfile
   dontpad.seusite.com {
       reverse_proxy localhost:8080
   }

   dontpadsrv.seusite.com {
       reverse_proxy localhost:1234
   }
   ```
3. Acesse em seu navegador via `http://dontpad.seusite.com`.

Para parar o serviço:
```bash
make stop
```

---
**Inspiração:** https://dontpad.com.br/#features
**Texto âncora:** https://mercadoonlinedigital.com/blog/dontpad/
