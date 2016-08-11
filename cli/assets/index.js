const View = require('./view');
const debug = require('debug')('tinylr:dashboard');

localStorage.debug = 'tinylr:*'
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
    socket.on('news', function (data) {
      console.log('news', data);
      socket.emit('my other event', { my: 'data' });
    });

    socket.on('tinylr:destroy', function (data) {
      let view = views[data.id];
      if (!view) return;

      console.log('destroy', data, view, views);
      view.remove();
    });

    socket.on('tinylr:create', function (data) {
      console.log('create', data);
      createClient(data);
    });
  });

function createClient(client) {
  if (!client.url) return;

  let view = views[client.id] = new View({
    name: 'client-' + client.id,
    defaults: client
  });

  console.log('create view', client);
  view.appendTo(document.querySelector('.js-app'));
}
