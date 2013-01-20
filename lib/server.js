
var fs        = require('fs');
var qs        = require('qs');
var path      = require('path');
var util      = require('util');
var http      = require('http');
var events    = require('events');
var parse     = require('url').parse;
var debug     = require('debug')('tinylr:server');
var Client    = require('./client');
var constants = require('constants');

var config = require('../package.json');

module.exports = Server;

function Server(options) {
  options = this.options = options || {};
  events.EventEmitter.call(this);

  options.livereload = options.livereload || path.join(__dirname, 'public/livereload.js');

  this.server = http.createServer(this.handler.bind(this));

  this.on('GET /', this.index.bind(this));
  this.on('GET /changed', this.changed.bind(this));
  this.on('POST /changed', this.changed.bind(this));
  this.on('GET /livereload.js', this.livereload.bind(this));
  this.on('GET /kill', this.close.bind(this));
  this.server.on('error', this.error.bind(this));

  this.clients = {};
  this.server.on('upgrade', this.websocketify.bind(this));
}

util.inherits(Server, events.EventEmitter);

Server.prototype.middleware = function middleware() {
  return this.handler.bind(this);
};

Server.prototype.handler = function handler(req, res) {
  var self = this;
  var url = parse(req.url);
  req.on('data', function(chunk) {
    req.data = req.data || '';
    req.data += chunk;
  });

  req.on('end', function() {
    req.body = {};
    req.params = {};

    try {
      req.body = JSON.parse(req.data);
    } catch(e) {}

    if(url.query) req.params = qs.parse(url.query);

    // todo: parse Accept header
    res.setHeader('Content-Type', 'application/json');

    // do the routing
    var route = req.method + ' '  + url.pathname;
    var respond = self.emit(route, req, res);
    if(respond) return;

    res.writeHead(404);
    res.write(JSON.stringify({
      error: 'not_found',
      reason: 'no such route'
    }));
    res.end();
  });
};

Server.prototype.websocketify = function websocketify(req, socket, head) {
  var self = this;
  var client = new Client(req, socket, head);
  this.clients[client.id] = client;

  debug('upgrade event');
  debug('New LiveReload connection (id: %s)', client.id);
  client.on('end', function() {
    debug('Destroy client %s (url: %s)', client.id, client.url);
    delete self.clients[client.id];
  });
};

Server.prototype.listen = function listen(port, fn) {
  this.port = port;
  this.server.listen(port, fn);
};

Server.prototype.close = function close(req, res) {
  if(res) res.end();

  Object.keys(this.clients).forEach(function(id) {
    this.clients[id].close();
  }, this);

  this.server.close(this.emit.bind(this, 'close'));
};

Server.prototype.error = function error(e) {
  console.error();
  console.error('... Uhoh. Got error %s ...', e.message);
  console.error(e.stack);

  if(e.code !== constants.EADDRINUSE) return;
  console.error();
  console.error('You already have a server listening on %s', this.port);
  console.error('You should stop it and try again.');
  console.error();
};

// Routes

Server.prototype.livereload = function livereload(req, res) {
  fs.createReadStream(this.options.livereload).pipe(res);
};

Server.prototype.changed = function changed(req, res) {
  var files = [];
  if(req && req.body && req.body.files) files = req.body.files;
  if(req && req.params && req.params.files) files = req.params.files;

  // normalize files array
  files = Array.isArray(files) ? files :
    typeof files === 'string' ? files.split(/[\s,]/) :
    [];


  debug('Changed event (Files: %s)', files.join(' '));
  var clients = Object.keys(this.clients).map(function(id) {
    var client = this.clients[id];
    debug('Reloading client %s (url: %s)', client.id, client.url);
    client.reload(files);
    return {
      id: client.id,
      url: client.url
    };
  }, this);

  if(!res) return;

  res.write(JSON.stringify({
    clients: clients,
    files: files
  }));

  res.end();
};

Server.prototype.index = function index(req, res) {
  res.write(JSON.stringify({
    tinylr: 'Welcome',
    version: config.version
  }));

  res.end();
};
