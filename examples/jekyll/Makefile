
include ../../includes/tiny-lr.mk

SITE ?= _site
SITE_FILES ?= $(shell find $(SITE) -name '*.html' \! -name '*.js' \! -name '*.css')

JEKYLL_DIR ?= .
JEKYLL_FILES = $(shell find _posts -name '*.md')
JEKYLL_FILES += $(shell find stylesheets -name '*.css' \! -name '*.sass' \! -name '*.scss')

jekyll serve:
	# make serve &>_log/jekyll.log
	bundle exec jekyll

$(JEKYLL_DIR): $(JEKYLL_FILES)
	@echo ... $? has changed. Reload ...
	@touch $@
	sleep 0.500
	curl -X POST http://localhost:35729/changed -d '{ "files": "$?" }'

compile: livereload $(JEKYLL_DIR)

.PHONY: jekyll serve compile
