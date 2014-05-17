var port = process.env.LR_PORT || process.env.PORT || 35729;

var path    = require('path');
var express = require('express');
var tinylr  = require('../..');
var body    = require('body-parser');
var debug   = require('debug')('tinylr:server');

process.env.DEBUG = process.env.DEBUG || 'tinylr*';

var app = express();

function logger(fmt) {
  fmt = fmt || '%s - %s';

  return function logger(req, res, next) {
    debug(fmt, req.method, req.url);
    next();
  }
}

app
  .use(logger())
  .use(body())
  .use('/', express.static(path.join(__dirname)))
  .use(tinylr.middleware({ app: app }))
  .listen(port, function(err) {
    if (err) throw err;
    debug('listening on %d', port);
  });
