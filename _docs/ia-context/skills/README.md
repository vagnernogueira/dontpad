# xskills

## Catálogo de skills

1. `context7-cli`
	Skill para usar o CLI do Context7 para consultar documentação atualizada, gerenciar skills e configurar o MCP do Context7.
	Origem: importada de `upstash/context7`.

2. `documentation-blueprint`
	Skill para estruturar, revisar e evoluir documentação técnica do projeto com base em um blueprint documental e em modos de operação como bootstrap, review e wave-management.
	Origem: própria deste repositório.

3. `find-docs`
	Skill para localizar documentação, referências de API e exemplos atualizados de bibliotecas, frameworks, SDKs, CLIs e serviços.
	Origem: importada de `upstash/context7`.

4. `generate-demand`
	Skill para converter texto livre em uma demanda estruturada em Markdown, selecionando o template adequado e gerando um artefato pronto para execução por IA.
	Origem: própria deste repositório.

5. `shadcn`
	Skill para trabalhar com `shadcn/ui`, cobrindo busca, adição, composição, correção, debug e estilização de componentes e projetos.
	Origem: importada de `shadcn-ui/ui`.

6. `skill-creator`
	Skill para criar novas skills, evoluir skills existentes e medir sua qualidade com avaliações, benchmarks e melhorias iterativas.
	Origem: importada de `anthropics/skills`.

7. `xinit`
	Skill para inicializar e validar a configuração dos players de IA de um projeto que já segue a estrutura `ia-context`, incluindo Claude Code, Gemini, Copilot, OpenAgents e OpenCode.
	Origem: própria deste repositório.

8. `demand-execution-planning`
	Skill para planejar a execução de uma demanda já estruturada ou revisar esse planejamento, escrevendo a seção `Planejamento da execução` na própria demanda, inclusive quando o template original não trouxer essa seção.
	Origem: própria deste repositório.

## 1. Para adicionar como pasta de skills

`git subtree add --prefix=_docs/ia-context/skills git@github.com:vagnernogueira/xskills.git main --squash`

Em seguida: `git push`

## 2. Para atualizar a pasta de skills quando houver alterações neste repositório

`git subtree pull --prefix=_docs/ia-context/skills git@github.com:vagnernogueira/xskills.git main --squash`

Em seguida: `git push`

A atualização pode ser facilitada utilizando o Makefile deste repositório.

## NOTA

Outra opção seria utilizar o recurso de "Sparse checkout" do git, mas o subtree é mais aderente ao uso com ferramentas de IA.

Para utilizar a clonagem em outra pasta no repositório alvo, altere o path relativo no parâmetro --prefix. Ex:

`git subtree add --prefix=skills git@github.com:vagnernogueira/xskills.git main --squash`
