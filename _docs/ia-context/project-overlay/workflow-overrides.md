# Dontpad — Workflow Overrides

Estas regras complementam o `core/workflow.md` apenas para este projeto.

- Trabalhar em etapas quando a demanda for multi-fase.
- Fazer build/compile simples com npm ao final da implementação para verificar erros de sintaxe e corrigi-los quando aplicável ao escopo.
- Após implementação, use o `make stop` para parar a aplicação localmente, sem seguida `make build` para gerar a nova e imagem e corrigir qualquer possível falha de build que venha a ocorrer, e por fim `make run` para rodar a aplicação novamente com as mudanças. Não efetue testes no navegador web.
- Ao finalizar: entregar resumo objetivo, arquivos alterados, impactos, validações recomendadas e sugestão do commit message em inglês seguindo o padrão de mensagens de commit do projeto.
