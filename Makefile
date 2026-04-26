.PHONY: sync-skills update-skills

SKILLS_REPO ?= git@github.com:vagnernogueira/xskills.git
SKILLS_BRANCH ?= main
SKILLS_PREFIX ?= _docs/ia-context/skills

update-skills:
	@if ! git log --format=%H --grep='^git-subtree-dir: $(SKILLS_PREFIX)$$' -n 1 | grep -q .; then \
		echo "Erro: o repositório atual não contém a subtree $(SKILLS_PREFIX)."; \
		exit 1; \
	fi
	ALLOW_SKILLS_CHANGES=1 GIT_MERGE_AUTOEDIT=no git subtree pull --prefix=$(SKILLS_PREFIX) $(SKILLS_REPO) $(SKILLS_BRANCH) --squash

sync-skills: update-skills
	ALLOW_SKILLS_CHANGES=1 git push
