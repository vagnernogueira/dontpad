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
- **Banco de Dados:** SQLite, armazenando o vetor de estados do Yjs via disco rígido de forma simples.
- **Infraestrutura:** Podman com Compose Files, garantindo que tudo possa ser subido com um comando.

## Rodando Localmente (Desenvolvimento)

Para rodar este projeto em sua máquina durante o desenvolvimento:

1. Clone o repositório.
2. Acesse a pasta do backend: `cd backend`
3. Instale as dependências: `npm install`
4. Inicie o servidor: `npm run dev`
5. Em outro terminal, acesse a pasta do frontend: `cd frontend`
6. Instale as dependências: `npm install`
7. Inicie o frontend: `npm run dev`

## Deploy On-Premises (Produção)

A principal justificativa deste projeto é ter um *dontpad on-premises*, onde os dados da sua equipe ou empresa ficam salvos no seu próprio servidor.

Para isso, providenciamos suporte nativo via **Podman**. Você não precisa instalar Node.js ou configurar bancos de dados.

### Requisitos
- Podman instalado no seu SO.
- `podman-compose` ou acesso via `Makefile`.

### Como iniciar o serviço

1. Digite no terminal raiz do projeto para criar as imagens e subir os containers:
   ```bash
   make run
   ```
2. Acesse em seu navegador via `http://localhost:8080` (A porta dependerá do seu arquivo `docker-compose.yml`).

Para parar o serviço:
```bash
make stop
```

---
**Inspiração:** https://dontpad.com.br/#features
**Texto âncora:** https://mercadoonlinedigital.com/blog/dontpad/
