all: help

help:
	make -h

babel:
	babel lib/ -d src/

test: eslint mocha

mocha: babel
	mocha --reporter spec

serve:
	node examples/express/server.js

eslint:
	eslint . --debug

fix:
	eslint . --fix

watch:
	watchd lib/**.js test/wd/index.js package.json -c 'make test'
