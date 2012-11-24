
var qs      = require('qs');
var util    = require('util');
var http    = require('http');
var events  = require('events');
var parse   = require('url').parse;
var request = require('request');
var Client  = require('./client');

module.exports = Server;

function Server(options) {
  options = options || {};
  events.EventEmitter.call(this);

  this.server = http.createServer(this.handler.bind(this));

  this.on('GET /changed', this.changed.bind(this));
  this.on('POST /changed', this.changed.bind(this));
  this.on('GET /livereload.js', this.livereload.bind(this));
  this.on('GET /kill', this.close.bind(this));
  this.server.on('error', this.error.bind(this));

  this.clients = {};
  this.server.on('upgrade', this.websocketify.bind(this));
}

util.inherits(Server, events.EventEmitter);

Server.prototype.handler = function handler(req, res) {
  var self = this;
  var url = parse(req.url);

  // todo: put into decorate
  if(url.query) req.params = qs.parse(url.query);

  req.on('data', function(chunk) {
    req.data = req.data || '';
    req.data += chunk;
  });

  req.on('end', function() {
    req.body = {};

    try {
      req.body = JSON.parse(req.data);
    } catch(e) {}

    // do the routing
    var route = req.method + ' '  + url.pathname;
    var respond = self.emit(route, req, res);
    if(respond) return;

    // todo handle 404
    res.writeHead(200, "OK", {'Content-Type': 'text/html'});
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
    console.log('... Destroying client %s (%s) ...', client.id, client.url);
    delete self.clients[client.id];
  });
};

Server.prototype.listen = function listen(port, fn) {
  this.server.listen(port, fn);
};

Server.prototype.close = function close(req, res) {
  Object.keys(this.clients).forEach(function(id) {
    this.clients[id].close();
  }, this);

  this.server.close();

  process.nextTick(function() {
    process.exit();
  });

  res.end();
};

Server.prototype.error = function error(e) {
  console.error();
  console.error('... Uhoh. Got error %s', e.message);
  console.error(e.stack);

  console.error();
  console.error('You already have a server listening on %s', opts.port);
  console.error('You should stop it and try again.');
  console.error();
};

// Routes

Server.prototype.livereload = function livereload(req, res) {
  request('https://raw.github.com/livereload/livereload-js/master/dist/livereload.js')
    .pipe(res);
};

Server.prototype.changed = function changed(req, res) {
  var files = req.body.files || req.params.files;

  var clients = Object.keys(this.clients).map(function(id) {
    return this.clients[id].url;
  }, this);

  // res.write('Ok Buddy! I\'ll tell them!\n\n');
  // res.write('Clients: ' + JSON.stringify(clients, null, 2) + '\n');
  // res.write('Files: ' + JSON.stringify(files, null, 2) + '\n');

  Object.keys(this.clients).forEach(function(id) {
    var client = this.clients[id];
    console.log('... Reloading client %s (%s)...', client.id, client.url);
    client.reload(files);
  }, this);

  res.end();
};

