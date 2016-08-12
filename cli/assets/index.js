/* globals fetch, localStorage, io */
const View = require('./view');
const debug = require('debug')('tinylr:dashboard');

localStorage.debug = 'tinylr:*';
let views = {};

fetch('/clients')
  .then((res) => {
    return res.json();
  })
  .then((json) => {
    // todo: only display current page if on dashboard
    json.clients.forEach(createClient);

    // Handle socketio events
    let socket = io('http://localhost:3000');
    socket.on('tinylr:destroy', function (data) {
      let view = views[data.id];
      if (!view) return;

      debug('destroy', data, view, views);
      view.remove();
    });

    socket.on('tinylr:create', function (data) {
      debug('create', data);
      createClient(data);
    });
  });

function createClient (client) {
  if (!client.url) return;

  let view = views[client.id] = new View({
    name: 'client-' + client.id,
    defaults: client
  });

  debug('create view', client);
  view.appendTo(document.querySelector('.js-app'));
}
