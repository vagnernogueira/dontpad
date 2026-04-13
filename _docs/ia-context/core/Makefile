.PHONY: sync-core update-core

SKILLS_REPO ?= git@github.com:vagnernogueira/ia-context.git
SKILLS_BRANCH ?= main
SKILLS_PREFIX ?= _docs/ia-context/core

update-core:
	@if ! git log --format=%H --grep='^git-subtree-dir: $(SKILLS_PREFIX)$$' -n 1 | grep -q .; then \
		echo "Erro: o repositório atual não contém a subtree $(SKILLS_PREFIX)."; \
		exit 1; \
	fi
	GIT_MERGE_AUTOEDIT=no git subtree pull --prefix=$(SKILLS_PREFIX) $(SKILLS_REPO) $(SKILLS_BRANCH) --squash

sync-core: update-core
	git push