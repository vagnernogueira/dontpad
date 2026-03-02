# Dontpad - Colaboração em texto

> Edição de texto colaborativo em tempo real, simples e funcional.

## Visão Geral

O Dontpad é uma ferramenta de edição colaborativa em tempo real para notas rápidas, snippets de código e escrita compartilhada.
O foco é simplicidade: o usuário acessa uma URL e começa a editar imediatamente, com sincronização instantânea entre múltiplos
participantes.

## Stack de Tecnologias

- **Linguagem:** TypeScript
- **Frontend:** Vue.js 3, Vite, Tailwind CSS, CodeMirror 6
- **Backend:** Node.js, Express, WebSocket (`ws`)
- **Colaboração em tempo real:** Yjs (`y-websocket`, `y-codemirror.next`)
- **Banco de dados:** LevelDB via `y-leveldb`
- **Infraestrutura:** Podman, Compose e `Makefile`

## Principais Funcionalidades

- Edição colaborativa em tempo real com cursores múltiplos.
- Criação instantânea de documentos via URL amigável.
- Organização por subdocumentos com rotas hierárquicas.
- Suporte a texto simples e Markdown.
- Salvamento automático e persistência local.
- Bloqueio de documento por senha com bypass administrativo por senha mestre.

## Convenções de Frontend

- **Ícones:** usar `lucide-vue-next` em telas e componentes novos.
- **Evitar SVG inline:** não adicionar tags `<svg>` diretamente em templates Vue.
- **Consistência:** ao precisar de novo ícone, importar o componente da biblioteca.

## Guia de Onboarding

### Pré-requisitos

- Node.js 20+
- npm 10+
- Podman
- `podman-compose` (ou uso dos comandos do `Makefile`)

### Instalação e Configuração

```bash
# 1) Clone o repositório
git clone <url-do-repositorio>
cd dontpad

# 2) Configure variáveis locais
cp .env.example .env
```

Defina no `.env` ao menos:

- `VITE_HOME_DOCS_PASSWORD` com uma senha forte.

### Como Compilar

```bash
# frontend
cd frontend
npm install
npm run build

# backend
cd ../backend
npm install
npm run build
```

### Como Executar

```bash
# Terminal 1 (backend)
cd backend
npm install
npm run dev

# Terminal 2 (frontend)
cd frontend
npm install
npm run dev
```

### Como Executar em Produção (On-Premises)

Crie um `.env` na raiz (mesmo nível de `docker-compose.yml`) com:

```bash
VITE_HOME_DOCS_PASSWORD=defina-uma-senha-forte
VITE_HOME_DOCS_SHORTCUT=Alt+R
VITE_BACKEND_HTTP_URL=https://dontpad.vagnernogueira.com
VITE_BACKEND_WS_URL=wss://dontpad.vagnernogueira.com/api
```

Suba o ambiente:

```bash
make run
```

Pare o ambiente:

```bash
make stop
```

### Como Executar os Testes

Atualmente não há suíte de testes automatizada padronizada na raiz do projeto.
Quando aplicável, rode validações por pacote:

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

## Ondas de Desenvolvimento

Histórico e evolução do projeto:

<!-- markdownlint-disable MD060 -->
| Onda | Nome             | Status       | Período     | Pasta                                                       |
| ---- | ---------------- | ------------ | ----------- | ----------------------------------------------------------- |
| 1    | MVP colaborativo | Em andamento | 2026-02 / - | [agent-workspace/execucao/](./agent-workspace/execucao/)    |
<!-- markdownlint-enable MD060 -->

## Documentação Adicional

- [Arquitetura do Sistema](./ARCHITETURE.md) — decisões técnicas, visão arquitetural e componentes.
- [Plugins do CodeMirror](./_docs/ARCHITETURE-plugins.md) — estrutura, uso e implementação dos plugins customizados do editor.
- [Documentação do CodeMirror](./codemirror6-documentation.md) — Cópia da documentação oficial do CodeMirror 6, em formato Markdown.

---
