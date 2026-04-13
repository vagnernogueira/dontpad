# Nome do Projeto

> Tagline ou descrição curta (uma linha).

## Visão Geral

Breve descrição do que o projeto faz, qual problema resolve e quem são os usuários.

## Stack de Tecnologias

Lista resumida das principais tecnologias utilizadas.

- **Linguagem:** ...
- **Framework principal:** ...
- **Bibliotecas principais:** ...
- **Banco de dados:** ...
- **Infraestrutura:** ...

## Principais Funcionalidades

- Funcionalidade A
- Funcionalidade B
- Funcionalidade C

## Guia de Onboarding

### Pré-requisitos

Liste tudo que o desenvolvedor precisa ter instalado antes de começar.

- Java >= 8
- Node.js >= 20.x
- Docker >= 24.x
- ...

### Instalação e Configuração

Passo a passo para obter o projeto localmente.

```bash
# 1. Clone o repositório
git clone https://github.com/org/projeto.git
cd projeto

# 2. Copie e configure as variáveis de ambiente
cp .env.example .env

# 3. Instale as dependências
npm install
```

### Como Compilar

```bash
npm run build
```

### Como Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Com Docker
docker compose up
```

### Como Executar os Testes

```bash
npm test
```

## Ondas de Desenvolvimento

Histórico de ondas de entrega do projeto:

| Onda | Nome               | Status       | Período           | Pasta                            |
| ---- | ------------------ | ------------ | ----------------- | -------------------------------- |
| 1    | MVP                | Entregue     | AAAA-MM / AAAA-MM | [_docs/1-mvp/](./_docs/1-mvp/)   |
| 2    | [Nome da Evolução] | Em andamento | AAAA-MM / -       | [_docs/2-nome/](./_docs/2-nome/) |

## Documentação Adicional

Para aprofundamento técnico, consulte os seguintes documentos:

- [Hub de Arquitetura](./_docs/ARCHITECTURE.md) — Visão arquitetural central, contratos globais e mapa de módulos.
- [Módulos de Arquitetura](./_docs/architecture/) — Detalhamento técnico por domínio para leitura incremental.
- [Documentação do Projeto](./_docs/) — Repositório centralizado de documentação técnica (arquitetura, requisitos, atas, testes e decisões por onda).
