const events    = require('events');
const WebSocket = require('faye-websocket');

let idCounter = 0;

class Client extends events.EventEmitter {

  constructor (req, socket, head, options) {
    super();
    options = this.options = options || {};
    this.ws = new WebSocket(req, socket, head);
    this.ws.onmessage = this.message.bind(this);
    this.ws.onclose = this.close.bind(this);
    this.id = this.uniqueId('ws');
  }

  message (event) {
    let data = this.data(event);
    if (this[data.command]) return this[data.command](data);
  }

  close (event) {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.emit('end', event);
  }

  // Commands
  hello () {
    this.send({
      command: 'hello',
      protocols: [
        'http://livereload.com/protocols/official-7'
      ],
      serverName: 'tiny-lr'
    });
  }

  info (data) {
    this.plugins = data.plugins;
    this.url = data.url;
  }

  // Server commands
  reload (files) {
    files.forEach(function (file) {
      this.send({
        command: 'reload',
        path: file,
        liveCSS: this.options.liveCSS !== false,
        liveJs: this.options.liveJs !== false,
        liveImg: this.options.liveImg !== false
      });
    }, this);
  }

  alert (message) {
    this.send({
      command: 'alert',
      message: message
    });
  }

  // Utilities
  data (event) {
    let data = {};
    try {
      data = JSON.parse(event.data);
    } catch (e) {}
    return data;
  }

  send (data) {
    this.ws.send(JSON.stringify(data));
  }

  uniqueId (prefix) {
    let id = idCounter++;
    return prefix ? prefix + id : id;
  }
}

module.exports = Client;
