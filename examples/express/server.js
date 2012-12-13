
var path    = require('path');
var express = require('express');
var Server  = require('../..');

var port = process.argv.slice(2)[0] || 3000;

// todo: double check upgrade event on the the express app correctly goes
// throuh  the LR server

var app = express()
  .use(express.static(path.resolve('./')));
  .use(new Server().middleware());

app.listen(port, function(err) {
  if(err) throw err;
  console.log('listening on %d', port);
});
