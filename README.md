# Dontpad - Colaboração em texto

> Edição de texto colaborativo em tempo real, simples e funcional.

## Visão Geral

O Dontpad é uma ferramenta de edição colaborativa em tempo real para notas rápidas, snippets de código e escrita compartilhada.
O foco é simplicidade: o usuário acessa uma URL e começa a editar imediatamente, com sincronização instantânea entre múltiplos
participantes.

## Stack de Tecnologias

- **Linguagem:** TypeScript
- **Frontend:** Vue.js 3, Vite, Tailwind CSS v4, shadcn-vue, CodeMirror 6
- **Backend:** Node.js, Express, WebSocket (`ws`)
- **CLI:** Node.js, TypeScript, commander.js, Yjs (`y-websocket`)
- **Colaboração em tempo real:** Yjs (`y-websocket`, `y-codemirror.next`)
- **Banco de dados:** LevelDB via `y-leveldb`
- **Infraestrutura:** Podman, Compose e `Makefile`

## Principais Funcionalidades

- Edição colaborativa em tempo real com cursores múltiplos.
- Criação instantânea de documentos via URL amigável.
- Organização por subdocumentos com rotas hierárquicas.
- Suporte a texto simples e Markdown.
- CLI isolado para configurar acesso, ler, exportar, atualizar e criar documentos sem endpoint novo no backend.
- Normalização de tabelas Markdown com atalho `Alt+Shift+T`.
- Salvamento automático e persistência local.
- Bloqueio de documento por senha com bypass administrativo por senha mestre.
- Explorer administrativo em `/explorer`, protegido por senha mestra.
- Gestão centralizada de documentos com ordenação, filtro e ações por item.
- Criação de documentos a partir de templates reais em `/_tmpl/`, com opção `blank` como padrão.
- Acesso por URL com query params para modos `pdf`, `view` e `raw` sem abrir a interface de edição nesses modos.

## Convenções de Frontend

- **Ícones:** usar `lucide-vue-next` em telas e componentes novos.
- **Evitar SVG inline:** não adicionar tags `<svg>` diretamente em templates Vue.
- **Consistência:** ao precisar de novo ícone, importar o componente da biblioteca.
- **UI base:** o frontend mantém componentes shadcn-vue versionados em `frontend/src/components/ui/`, hoje com `alert`, `alert-dialog`, `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `input`, `label`, `separator`, `switch` e `table`.
- **shadcn-vue:** executar a CLI a partir de `frontend/`, usando `npx shadcn-vue@latest ...` ou `npm run shadcn:info`. Rodar `npx shadcn@latest` na raiz identifica o workspace como projeto manual e não valida a configuração real do frontend.
- **Tailwind CSS v4:** o frontend usa `src/styles/base.css` como ponto de entrada com `@import "tailwindcss"`; `tailwind.config.js` continua ativo via `@config` para tokens, breakpoints e plugins.

## Guia de Onboarding

### Pré-requisitos

- Node.js 20+
- npm 10+
- GNU Make
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

- `DOCUMENTS_MASTER_PASSWORD` com uma senha forte para APIs administrativas e acesso ao Explorer.

### Como Compilar

```bash
# instala as dependências usadas pelos fluxos web atuais
make install

# executa os testes existentes e gera as imagens do backend e frontend
make build
```

O pacote `cli/` permanece autocontido e deve ser instalado separadamente:

```bash
cd cli
npm install
```

Para verificações específicas do frontend que não possuem alvo dedicado no `Makefile`, continue usando os scripts do pacote:

```bash
cd frontend
npm run shadcn:info
```

### Como Executar

```bash
# Terminal 1 (backend)
make dev-backend

# Terminal 2 (frontend)
make dev-frontend
```

### Como Executar em Produção (On-Premises)

Crie um `.env` na raiz (mesmo nível de `docker-compose.yml`) com:

```bash
DOCUMENTS_MASTER_PASSWORD=defina-uma-senha-forte
VITE_BACKEND_HTTP_URL=https://dontpad.vagnernogueira.com
VITE_BACKEND_WS_URL=wss://dontpad.vagnernogueira.com/api
```

## Explorer de Documentos

- Rota: `/explorer`.
- Acesso: exige senha mestra válida (`DOCUMENTS_MASTER_PASSWORD`).
- A rota não cria documento automaticamente.
- A tela lista documentos com: seleção, nome, data de criação, data de alteração, travado (S/N), vazio (S/N), aberto (S/N).
- Suporta ordenação por coluna, busca por nome e seleção única.
- Ações disponíveis na toolbar do Explorer: atualizar, backup geral, renomear, remover, download markdown, download PDF e travar.

## Templates de Documentos

- A Home lista uma opção virtual `blank` e os templates reais encontrados em `/_tmpl/`.
- `blank` permanece como seleção padrão e preserva o fluxo atual de criação de documento vazio.
- Ao abrir um documento com template selecionado, o conteúdo do template só é copiado se o documento de destino for novo ou estiver vazio.
- Se o documento de destino já tiver conteúdo, o template é ignorado e o documento existente é aberto normalmente.

## Acesso por URL (query params)

A rota de documento aceita parâmetros para entregar formatos alternativos do mesmo conteúdo:

- `/<documento>?pdf`: gera e inicia download do PDF automaticamente.
- `/<documento>?view`: renderiza preview HTML estilizado do Markdown.
- `/<documento>?raw`: exibe Markdown bruto no navegador.

Regras:

- A resolução desses modos é feita por um componente dedicado de rota no frontend, sem abrir a interface de edição nesses cenários.
- Sem query params especiais, `/<documento>` continua no modo padrão de edição colaborativa.
- Se o documento estiver travado por senha, qualquer modo especial (`pdf`, `view`, `raw`) exige autenticação válida antes de liberar conteúdo.

Suba o ambiente:

```bash
make run
```

Pare o ambiente:

```bash
make stop
```

### Como Executar os Testes

Os testes existentes dos dois pacotes podem ser executados pela raiz do projeto com:

```bash
make test
```

Quando precisar de validações que ainda não possuem alvo dedicado no `Makefile`, rode por pacote:

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

## CLI

O repositório agora inclui um CLI funcional em `cli/`, mantido como pacote isolado e sem conversão da raiz para workspace npm.

Bootstrap rápido:

```bash
cd cli
npm install
npm run build
npm start -- --help
```

Fluxos disponíveis:

- `dontpad config` para persistir `baseUrl`, `wsBaseUrl` opcional e `masterPassword` opcional;
- `dontpad get` para ler Markdown por path ou URL completa e opcionalmente exportar para `.md`;
- `dontpad update` para substituir o conteúdo de um documento a partir de argumento, arquivo ou stdin;
- `dontpad create` para criar documento em branco ou com conteúdo inicial.

Contratos reutilizados pelo CLI:

- `GET /api/document-content` e `GET /api/public-document-content` para leitura;
- sincronização Yjs via WebSocket para atualização e criação, alinhada ao editor web;
- sem criação de endpoint específico para a interface de linha de comando.

Exemplos rápidos:

```bash
cd cli
npm run dev -- config set --base-url http://localhost:3001 --master-password minha-senha
npm run dev -- get me/todo --output ./tmp/todo.md --no-print
printf '# Atualizado pelo CLI\n' | npm run dev -- update me/todo --stdin
npm run dev -- create drafts/nova-nota --content '# Rascunho\n'
```

Documentação detalhada, opções e estratégia de validação com `XDG_CONFIG_HOME` temporário estão em `cli/README.md`.

## Ondas de Desenvolvimento

Histórico e evolução do projeto:

| Onda | Nome             | Status       | Período     | Pasta                                                       |
| ---- | ---------------- | ------------ | ----------- | ----------------------------------------------------------- |
| 1    | MVP colaborativo | Em andamento | 2026-02 / - | [agent-workspace/execucao/](./agent-workspace/execucao/)    |

## Documentação Adicional

- [Arquitetura do Sistema (Hub)](./_docs/ARCHITECTURE.md) — visão central, contratos e navegação dos módulos.
- [Arquitetura de Plugins do CodeMirror](./_docs/architecture/plugins-codemirror.md) — plugins, keymaps, snippets e limites do parser.
- [Explorer de Documentos](./_docs/architecture/explorer.md) — fluxo funcional, regras e endpoints da gestão administrativa.
- **CodeMirror 6:** documentação oficial e changelog devem ser consultados diretamente quando necessário.

---

## Licença

Este projeto adota a licença BSD-3-Clause. Consulte o arquivo [LICENSE](./LICENSE) para o texto completo.
