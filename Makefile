all: help

help:
	make -h

babel:
	babel lib/ -d src/
	babel test/ -d src_test/

test: eslint mocha

mocha: babel
	mocha --reporter spec src_test/

serve:
	node examples/express/server.js

eslint:
	eslint . --debug

fix:
	eslint . --fix

watch:
	watchd lib/**.js test/wd/index.js package.json -c 'make test'
