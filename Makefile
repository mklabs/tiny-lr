all: help

help:
	bake -h

babel:
	babel lib/ -d src/

test: eslint mocha

mocha: babel
	mocha --reporter spec

wd: babel
	mocha --reporter spec test/wd

serve:
	node examples/express/server.js

eslint:
	eslint . --debug

fix:
	eslint . --fix

watch:
	watchd lib/**.js test/wd/index.js package.json -c 'make test'

release: version push publish

version:
	standard-version -m '%s'

push:
	git push origin master --tags

publish:
	npm publish
