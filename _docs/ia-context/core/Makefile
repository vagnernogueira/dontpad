.PHONY: sync-skills update-skills

SKILLS_REPO ?= git@github.com:vagnernogueira/xskills.git
SKILLS_BRANCH ?= main
SKILLS_PREFIX ?= skills

update-skills:
	GIT_MERGE_AUTOEDIT=no git subtree pull --prefix=$(SKILLS_PREFIX) $(SKILLS_REPO) $(SKILLS_BRANCH) --squash

sync-skills: update-skills
	git push