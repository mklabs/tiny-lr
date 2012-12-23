
var qs      = require('qs');
var util    = require('util');
var http    = require('http');
var events  = require('events');
var parse   = require('url').parse;
var request = require('request');
var Client  = require('./client');

var config = require('../package.json');

module.exports = Server;

function Server(options) {
  options = options || {};
  events.EventEmitter.call(this);

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
  var client = new Client(req, socket, head);

  console.log();
  console.log('... Woot, a new livereload buddy! Welcome Friend, your id is %s', client.id);
  this.clients[client.id] = client;

  var self = this;
  client.on('end', function() {
    console.log();
    console.log('... Destroying client %s (%s) ...', client.id, client.url);
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
  console.error();
  console.error('You already have a server listening on %s', this.port);
  console.error('You should stop it and try again.');
  console.error();
  console.error(e.stack);
  console.error();
};

// Routes

Server.prototype.livereload = function livereload(req, res) {
  request('https://raw.github.com/livereload/livereload-js/master/dist/livereload.js')
    .pipe(res);
};

Server.prototype.changed = function changed(req, res) {
  var files = [];
  if(req && req.body && req.body.files) files = req.body.files;
  if(req && req.params && req.params.files) files = req.params.files;

  // normalize files array
  files = Array.isArray(files) ? files :
    typeof files === 'string' ? files.split(/[\s,]/) :
    [];

  var clients = Object.keys(this.clients).map(function(id) {
    var client = this.clients[id];
    console.log('... Reloading client %s (%s)...', client.id, client.url);

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
