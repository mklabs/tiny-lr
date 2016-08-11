const View = require('./view');
const debug = require('debug')('tinylr:dashboard');

// Apply a small delay to let livereload.js send a message with client info
// todo: remove settimeout by listening to websocket message or any other
// means, maybe pooling

let process = LiveReload.connector.protocolParser.process;

LiveReload.connector.protocolParser.process = function() {
  console.log('process', arguments);
  return process.apply(this, arguments);
};

setTimeout(() => {
  localStorage.debug = 'tinylr:*'
  let views = {};

  fetch('/clients')
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      // todo: only display current page if on dashboard
      // json.clients.forEach(createClient);

      // Handle socketio events
      let socket = io('http://localhost:3000');
      socket.on('news', function (data) {
        console.log('news', data);
        socket.emit('my other event', { my: 'data' });
      });

      socket.on('tinylr:destroy', function (data) {
        let view = views[data.id];
        if (!view) return;

        console.log('destroy', data, view, views);
        window.view = view;
        view.remove();
      });

      socket.on('tinylr:create', function (data) {
        console.log('create', data);
        createClient(data);
      });
    });

    function createClient(client) {
      let view = views[client.id] = new View({
        name: 'client-' + client.id,

        defaults: client
      });

      console.log('create view', client);
      view.appendTo(document.querySelector('.js-app'));
    }

}, 500);
