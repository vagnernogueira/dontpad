.PHONY: sync-skills update-skills

SKILLS_REPO ?= git@github.com:vagnernogueira/xskills.git
SKILLS_BRANCH ?= main
SKILLS_PREFIX ?= skills

update-skills:
	@if ! git log --format=%H --grep='^git-subtree-dir: $(SKILLS_PREFIX)$$' -n 1 | grep -q .; then \
		echo "Erro: o repositório atual não contém a subtree $(SKILLS_PREFIX)."; \
		exit 1; \
	fi
	GIT_MERGE_AUTOEDIT=no git subtree pull --prefix=$(SKILLS_PREFIX) $(SKILLS_REPO) $(SKILLS_BRANCH) --squash

sync-skills: update-skills
	git push