const View = require('./view');
const debug = require('debug')('tinylr:dashboard');

// Apply a small delay to let livereload.js send a message with client info
// todo: remove settimeout by listening to websocket message or any other
// means, maybe pooling
setTimeout(() => {
  localStorage.debug = 'tinylr:*'

  fetch('/clients')
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      debug('json', json, json.clients[0]);

      json.clients.forEach((client) => {
        var view = new View({
          name: 'client-' + client.id,

          defaults: client
        });

        view.appendTo(document.querySelector('.js-app'));
      });
    });


}, 500);
