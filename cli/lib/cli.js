const fs     = require('fs');
const path   = require('path');
const roar   = require('roar-cli');
const Server = require('../..');
const debug  = require('debug')('tinylr:cli');

export default class CLI extends roar.CLI {
  get example () {
    return 'tiny-lr [options]';
  }

  get more () {
    return `
  Examples:

    $ tiny-lr -p 3000
    $ tiny-lr ./site
    $ tiny-lr -wg '**/*.{html,css,js}'
`;
  }

  // Used to parse arguments with minimist
  get alias () {
    return {
      h: 'help',
      v: 'version',
      p: 'port'
      //   .option('--cert <path>', 'Path to the TLS certificate file (default: ./cert.pem)', String)
      //   .option('--key <path>', 'Path to the TLS key file (default: ./key.pem)', String)
    };
  }

  // Used to generate the help output, along with example / more above
  get flags () {
    return {
      help: 'Show this help output',
      version: 'Show package version'
    };
  }

  constructor (parser, options) {
    super(parser, options);

    this.options = Object.assign({}, options, this.argv);
    if (this.options.help) return this.help();
    if (this.options.version) return this.info(require('../package.json').version);

    this.options.port = this.options.port || 3000;
    this.options.pid = this.options.pid || path.resolve('tiny-lr.pid');
    this.options.dashboard = true;

    this.server = this.createServer(this.options);
    this.server.on('GET /', this.index.bind(this));
  }

  createServer (options = this.options) {
    var srv = new Server(options);

    srv.on('close', () => {
      process.nextTick(() => process.exit());
    });

    return srv;
  }

  index (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({
      tinylr: 'Welcome home'
    }));

    res.end();
  }

  listen (done = () => {}) {
    return this.server.listen(this.options.port, (err) => {
      if (err) return this.error(err);
      this.writePID(this.options, done);
    });
  }

  writePID ({ port, pid }, done) {
    debug('Writing pid file', pid, port);
    fs.writeFile(pid, process.pid, (err) => {
      if (err) {
        debug('... Cannot write pid file: %s', pid);
        process.exit(1);
      }

      debug('... Listening on %s (pid: %s) ...', port, process.pid);
      debug('... pid file: %s', pid);
      done();
    });
  }
}
