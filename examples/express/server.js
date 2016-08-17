const port = process.env.LR_PORT || process.env.PORT || 35729;

const debug = require('debug')('tinylr:server');

process.env.DEBUG = process.env.DEBUG || 'tinylr*';

const app = require('./app');

app.listen(port, function (err) {
  if (err) throw err;
  debug('listening on %d', port);
});
