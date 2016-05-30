all: help

help:
	bake -h

babel:
	babel lib/ -d src/

test: babel
	mocha --reporter spec

serve:
	node examples/express/server.js

eslint:
	eslint .

fix:
	eslint . --fix

watch:
	watchd lib/**.js test/wd/index.js package.json -c 'bake test'

release: version push publish

version:
	standard-version -m '%s'

push:
	git push origin master --tags

publish:
	npm publish
