all: help

help:
	bake -h

babel:
	babel lib/ -d src/

test: eslint mocha

mocha: babel
	mocha --reporter spec

eslint:
	eslint .

fix:
	eslint . --fix

release: version push publish

version:
	standard-version -m '%s'

push:
	git push origin master --tags

publish:
	npm publish
