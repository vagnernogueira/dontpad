# xskills

## 1. Para adicionar como pasta de skills

`git subtree add --prefix=skills git@github.com:vagnernogueira/xskills.git main --squash`

Em seguida: `git push`

## 2. Para atualizar a pasta de skills quando houver alterações neste repositório

`git subtree pull --prefix=skills git@github.com:vagnernogueira/xskills.git main --squash`

Em seguida: `git push`

A atualização pode ser facilitada utilizando o Makefile deste repositório.

## NOTA

Outra opção seria utilizar o recurso de "Sparse checkout" do git, mas o subtree é mais aderente ao uso com ferramentas de IA.
