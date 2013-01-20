
var path    = require('path');
var express = require('express');
var connect = require('connect');

// Here is the usual setup with connect or express.
//
// Tiny-lr needs query / bodyParse middlewares prior in the stack.
//
// Any handled requests ends at the tinylr level, not found and errors are
// nexted to the rest of the stack.
//
//    var lr = new tinylr.Server();
//
//    var app = express()
//      .use(express.query())
//      .use(express.bodyParser())
//      .use(lr.handler.bind(lr))
//      .use(express.static(path.resolve('./')))
//      .use(express.directory(path.resolve('./')));
//
//    srv = app.listen(port, lr.listen.bind(lr, port));
//    srv.on('upgrade', lr.websocketify.bind(lr));
//
// All this can be shorten to just
//
//    var app = express();
//
//    app
//      .use(express.query())
//      .use(express.bodyParser())
//      .use(tinylr.middleware({ app: app }))
//      .use(express.static(path.resolve('./')))
//      .use(express.directory(path.resolve('./')))
//      .listen(port)
//
// The port you listen on is important, and tinylr should **always** listen on
// the LiveReload standard one: `35729`. Otherwise, you won't be able to rely
// on the browser extensions, thoough you can still use the manual snippet
// approach.

var tinylr  = require('../..');

var port = process.argv.slice(2)[0] || 35729;

var app = express();
app.use(express.query())
  .use(express.bodyParser())
  .use(tinylr.middleware({ app: app }))
  .use(express.static(path.resolve('./')))
  .use(express.directory(path.resolve('./')))
  .listen(port, function() {
    console.log('listening on %d', port);
  });
