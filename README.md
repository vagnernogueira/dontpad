# xskills

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
