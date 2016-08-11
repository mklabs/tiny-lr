// Apply a small delay to let livereload.js send a message with client info
// todo: remove settimeout by listening to websocket message or any other
// means, maybe pooling
setTimeout(() => {
  fetch('/clients')
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      console.log('json', json, json.clients[0]);
    });
}, 500);
