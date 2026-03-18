# Skill — shadcn-vue

## Objetivo

Fornecer ao agente de IA o contexto necessário para trabalhar com componentes shadcn-vue
neste projeto: padrões de instalação via CLI, API de componentes, convenções de estilo,
integração com Tailwind e arquitetura Vue 3 do Dontpad.

> **Status de adoção:** **ATIVO** — integração concluída em 2026-03-18 (Fase 1 + Fase 2).
> `components.json` configurado, CSS variables aplicadas em `base.css`, `tailwind.config.js`
> estendido com tokens shadcn. Componentes instalados: `dialog`, `button`.
> Todos os 6 dialogs migrados para primitivos shadcn-vue (`Dialog`, `DialogContent`,
> `DialogHeader`, `DialogTitle`, `DialogFooter`). `BaseDialog.vue` refatorado como
> thin wrapper shadcn (sem usos diretos de UI — todos os dialogs usam shadcn diretamente).

---

## 1. Modelo de adoção — código copiado, não biblioteca

shadcn-vue **não é uma dependência versionada**. Cada componente adicionado via CLI
é copiado para `frontend/src/components/ui/` e passa a ser propriedade do projeto.
A dependência real é `reka-ui` (primitivos headless — foco, aria, keyboard, popper).

```
frontend/src/components/
├── ui/                     ← componentes shadcn-vue (copiados via CLI, modificáveis)
│   ├── button/
│   │   ├── Button.vue
│   │   └── index.ts
│   └── dialog/
│       ├── Dialog.vue
│       ├── DialogClose.vue
│       ├── DialogContent.vue
│       ├── DialogDescription.vue
│       ├── DialogFooter.vue
│       ├── DialogHeader.vue
│       ├── DialogScrollContent.vue
│       ├── DialogTitle.vue
│       ├── DialogTrigger.vue
│       └── index.ts
├── BaseDialog.vue           ← thin wrapper shadcn (sem usos diretos — todos os dialogs migrados)
├── AccessDialog.vue         ← usa Dialog shadcn diretamente ✓
├── LockDialog.vue           ← usa Dialog shadcn diretamente ✓
├── ImageDialog.vue          ← usa Dialog shadcn diretamente ✓
├── LinkDialog.vue           ← usa Dialog shadcn diretamente ✓
├── ProfileDialog.vue        ← usa Dialog shadcn diretamente ✓
└── Editor.vue               ← usa os dialogs acima (sem mudanças)
```

---

## 2. CLI — comandos essenciais

```bash
# Setup inicial (one-time)
npx shadcn-vue@latest init

# Adicionar componente
npx shadcn-vue@latest add dialog
npx shadcn-vue@latest add button tooltip alert-dialog toast

# Inspecionar projeto (util para contexto do agente)
npx shadcn-vue@latest info
npx shadcn-vue@latest info --json

# Preview sem escrever (dry run — usar antes de add em produção)
npx shadcn-vue@latest add button --dry-run
npx shadcn-vue@latest add button --diff

# Buscar componentes disponíveis
npx shadcn-vue@latest search [termo]

# Documentação inline de um componente
npx shadcn-vue@latest docs dialog
```

---

## 3. Estrutura de componente shadcn-vue

Cada componente segue o padrão:

```vue
<!-- frontend/src/components/ui/button.vue -->
<template>
  <component
    :is="asChild ? Slot : 'button'"
    :class="cn(buttonVariants({ variant, size }), $attrs.class ?? '')"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { buttonVariants } from '.'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}>(), {
  variant: 'default',
  size: 'default',
})
</script>
```

**Utilitário `cn()`** (obrigatório):

```ts
// frontend/src/lib/utils.ts — gerado pelo init
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 4. Mapeamento de componentes do projeto → shadcn-vue

| Componente atual (Dontpad)          | Equivalente shadcn-vue             | Status                         |
|-------------------------------------|-------------------------------------|--------------------------------|
| `BaseDialog.vue` (+ 5 dialogs filhos) | `Dialog` + `DialogContent`        | ✅ Migrado (Fase 2, 2026-03-18) |
| `ToolbarButton.vue` (active state)  | `Toggle`                           | Pendente (demanda futura)      |
| Botões `.btn-primary/secondary`     | `Button variant="default/outline"` | Pendente (demanda futura)      |
| Confirmação de remoção (Explorer)   | `AlertDialog`                      | Pendente (demanda futura)      |
| Tooltips (itens de toolbar)         | `Tooltip`                          | Pendente (demanda futura)      |
| Feedback de ação (download, lock)   | `Sonner` (toast)                   | Pendente (demanda futura)      |
| Select de tipo (futuras features)   | `Select`                           | Pendente (não existe ainda)    |

### Exemplo de migração: BaseDialog → Dialog

```vue
<!-- ANTES: BaseDialog.vue wrapping -->
<BaseDialog title="Meu Perfil" @close="close">
  <slot />
  <template #actions>
    <button class="btn-dialog-cancel" @click="close">Cancelar</button>
    <button class="btn-dialog-confirm" @click="save">Salvar</button>
  </template>
</BaseDialog>

<!-- DEPOIS: Dialog shadcn-vue -->
<Dialog :open="open" @update:open="open = $event">
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Meu Perfil</DialogTitle>
    </DialogHeader>
    <slot />
    <DialogFooter>
      <Button variant="outline" @click="open = false">Cancelar</Button>
      <Button @click="save">Salvar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 5. Theming — CSS Variables

Após `init`, o `base.css` recebe as variáveis de tema:

```css
/* frontend/src/styles/base.css — após init */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

E o `tailwind.config.js` é estendido:

```js
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      // ...
    },
  },
},
```

**Atenção Dontpad:** As cores hardcoded atuais (`emerald-600`, `gray-800`, `gray-900`)
convivem com as CSS variables durante a migração gradual. Não há conflito — apenas dupla manutenção temporária.

---

## 6. shadcn/skills

O mecanismo `shadcn/skills` (lançado em março 2026 com CLI v4) injeta contexto do projeto
automaticamente no assistente de IA. Ativa quando encontra `components.json` no projeto.

```bash
# Instalar a skill no projeto (após init)
npx skills add shadcn/ui
```

**O que a skill injeta automaticamente:**
- Output de `shadcn info --json` (framework, aliases, componentes instalados, lib base)
- Referência completa de CLI (`init`, `add`, `search`, `docs`, `diff`, `info`)
- Guia de theming (CSS variables, OKLCH, dark mode, Tailwind v3/v4)
- Documentação de registry authoring
- Configuração do MCP server

**Limitação Vue:** A skill oficial foi desenhada para React/Next.js. A instalação no projeto
Vue funciona no nível de CLI e theming, mas os exemplos de componentes são TSX.
Esta SKILL.md serve de complemento Vue-específico.

---

## 7. shadcn MCP Server

Ver referência completa em `project-overlay/mcp-servers.md`.

O MCP server permite ao agente:
- Listar componentes disponíveis no registry shadcn
- Buscar por nome ou funcionalidade
- Instalar componentes via linguagem natural

```
"adicione o componente Dialog ao projeto"
"encontre um form de login no registry shadcn"
"quais componentes shadcn estão instalados?"
```

---

## 8. Regras de uso neste projeto

1. **Novos componentes de UI** → preferir primitivos shadcn-vue a html bruto.
2. **Migração de dialogs** → substituir `BaseDialog.vue` por `Dialog` shadcn ao tocar em dialogs existentes.
3. **Nunca editar arquivos em `components/ui/`** para acomodar uma feature específica — customizar via `variant` ou wrapper.
4. **`cn()` é obrigatório** para concatenação de classes em componentes de UI.
5. Durante coexistência, `components/ui/` = shadcn; `components/` = domain. Não misturar.
6. Sempre rodar `npx shadcn-vue@latest add [componente] --dry-run` antes de instalar em ambiente de produção.
