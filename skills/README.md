# xskills

## 1. Para adicionar como pasta de skills

`git subtree add --prefix=skills git@github.com:vagnernogueira/xskills.git main --squash`

Em seguida: `git push`

## 2. Para atualizar a pasta de skills quando houver alterações neste repositório

`git subtree pull --prefix=skills git@github.com:vagnernogueira/xskills.git main --squash`

Em seguida: `git push`

## Makefile sugerido no repositório alvo

```
.PHONY: sync-skills update-skills

SKILLS_REPO ?= git@github.com:vagnernogueira/xskills.git
SKILLS_BRANCH ?= main
SKILLS_PREFIX ?= skills

update-skills:
	GIT_MERGE_AUTOEDIT=no git subtree pull --prefix=$(SKILLS_PREFIX) $(SKILLS_REPO) $(SKILLS_BRANCH) --squash

sync-skills: update-skills
	git push
```

## NOTA

Outra opção seria utilizar o recurso de "Sparse checkout" do git, mas o subtree é mais aderente ao uso com ferramentas de IA.
