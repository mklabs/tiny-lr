const fs     = require('fs');
const util   = require('util');
const http   = require('http');
const https  = require('https');
const events = require('events');
const parse  = require('url').parse;
const debug  = require('debug')('tinylr:server');
const Client = require('./client');

// Middleware fallbacks
const bodyParser  = require('body-parser').json();
const queryParser = require('./middleware/query')();

const config = require('../package.json');

class Server extends events.EventEmitter {

  constructor (options = {}) {
    super();

    this.options = options;
    events.EventEmitter.call(this);

    options.livereload = options.livereload || require.resolve('livereload-js/dist/livereload.js');

    // todo: change falsy check to allow 0 for random port
    options.port = parseInt(options.port || 35729, 10);

    this.on('GET /', this.index.bind(this));
    this.on('GET /changed', this.changed.bind(this));
    this.on('POST /changed', this.changed.bind(this));
    this.on('POST /alert', this.alert.bind(this));
    this.on('GET /livereload.js', this.livereload.bind(this));
    this.on('GET /kill', this.close.bind(this));

    if (options.errorListener) {
      this.errorListener = options.errorListener;
    }

    this.clients = {};
    this.configure(options.app);
  }

  configure (app) {
    let self = this;
    debug('Configuring %s', app ? 'connect / express application' : 'HTTP server');

    let handler = this.options.handler || this.handler;

    if (!app) {
      if ((this.options.key && this.options.cert) || this.options.pfx) {
        this.server = https.createServer(this.options, handler.bind(this));
      } else {
        this.server = http.createServer(handler.bind(this));
      }
      this.server.on('upgrade', this.websocketify.bind(this));
      this.server.on('error', function () {
        self.error.apply(self, arguments);
      });
      return this;
    }

    this.app = app;

    this.app.listen = function (port, done) {
      done = done || function () {};
      if (port !== self.options.port) {
        debug('Warn: LiveReload port is not standard (%d). You are listening on %d', self.options.port, port);
        debug('You\'ll need to rely on the LiveReload snippet');
        debug('> http://feedback.livereload.com/knowledgebase/articles/86180-how-do-i-add-the-script-tag-manually-');
      }

      let srv = self.server = http.createServer(app);
      srv.on('upgrade', self.websocketify.bind(self));
      srv.on('error', function () {
        self.error.apply(self, arguments);
      });
      srv.on('close', self.close.bind(self));
      return srv.listen(port, done);
    };

    return this;
  }

  handler (req, res, next) {
    let self = this;
    let middleware = typeof next === 'function';
    debug('LiveReload handler %s (middleware: %s)', req.url, middleware ? 'on' : 'off');

    this.parse(req, res, function (err) {
      debug('query parsed', req.body, err);
      if (err) return next(err);
      self.handle(req, res, next);
    });

    return this;
  }

  index (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({
      tinylr: 'Welcome',
      version: config.version
    }));

    res.end();
  }

  handle (req, res, next) {
    let url = parse(req.url);
    debug('Request:', req.method, url.href);
    let middleware = typeof next === 'function';

    // do the routing
    let route = req.method + ' ' + url.pathname;
    let respond = this.emit(route, req, res);
    if (respond) return;
    if (!middleware) {
      // Only apply content-type on non middleware setup #70
      res.setHeader('Content-Type', 'application/json');
    } else {
      // Middleware ==> next()ing
      return next();
    }

    res.writeHead(404);
    res.write(JSON.stringify({
      error: 'not_found',
      reason: 'no such route'
    }));
    res.end();
  }

  websocketify (req, socket, head) {
    let self = this;
    let client = new Client(req, socket, head, this.options);
    this.clients[client.id] = client;

    debug('New LiveReload connection (id: %s)', client.id);
    client.on('end', function () {
      debug('Destroy client %s (url: %s)', client.id, client.url);
      delete self.clients[client.id];
    });
  }

  listen (port, host, fn) {
    port = port || this.options.port;

    // Last used port for error display
    this.port = port;

    if (typeof host === 'function') {
      fn = host;
      host = undefined;
    }

    this.server.listen(port, host, fn);
  }

  close (req, res) {
    Object.keys(this.clients).forEach(function (id) {
      this.clients[id].close();
    }, this);

    if (this.server._handle) this.server.close(this.emit.bind(this, 'close'));

    if (res) res.end();
  }

  error (e) {
    if (this.errorListener) {
      this.errorListener(e);
      return;
    }

    console.error();
    console.error('... Uhoh. Got error %s ...', e.message);
    console.error(e.stack);

    if (e.code !== 'EADDRINUSE') return;
    console.error();
    console.error('You already have a server listening on %s', this.port);
    console.error('You should stop it and try again.');
    console.error();
  }

  // Routes

  livereload (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    fs.createReadStream(this.options.livereload).pipe(res);
  }

  changed (req, res) {
    let files = this.param('files', req);

    debug('Changed event (Files: %s)', files.join(' '));
    let clients = this.notifyClients(files);

    if (!res) return;

    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({
      clients: clients,
      files: files
    }));

    res.end();
  }

  alert (req, res) {
    let message = this.param('message', req);

    debug('Alert event (Message: %s)', message);
    let clients = this.alertClients(message);

    if (!res) return;

    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({
      clients: clients,
      message: message
    }));

    res.end();
  }

  notifyClients (files) {
    let clients = Object.keys(this.clients).map(function (id) {
      let client = this.clients[id];
      debug('Reloading client %s (url: %s)', client.id, client.url);
      client.reload(files);
      return {
        id: client.id,
        url: client.url
      };
    }, this);

    return clients;
  };

  alertClients (message) {
    let clients = Object.keys(this.clients).map(function (id) {
      let client = this.clients[id];
      debug('Alert client %s (url: %s)', client.id, client.url);
      client.alert(message);
      return {
        id: client.id,
        url: client.url
      };
    }, this);

    return clients;
  }

  // Lookup param from body / params / query.
  param (name, req) {
    let param;
    if (req.body && req.body[name]) param = req.body[name];
    else if (req.params && req.params[name]) param = req.params[name];
    else if (req.query && req.query[name]) param = req.query[name];

    // normalize files array
    if (name === 'files') {
      param = Array.isArray(param) ? param
        : typeof param === 'string' ? param.split(/[\s,]/)
        : [];
    }

    debug('param %s', name, req.body, req.params, req.query, param);
    return param;
  }

  // Ensure body / query are defined, useful as a fallback when the
  // Server is used without express / connect, and shouldn't hurt
  // otherwise
  parse (req, res, next) {
    debug('Parse', req.body, req.query);
    bodyParser(req, res, function (err) {
      debug('Body parsed', req.body);
      if (err) return next(err);

      queryParser(req, res, next);
    });
  }
}

module.exports = Server;
