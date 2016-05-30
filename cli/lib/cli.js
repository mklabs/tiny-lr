const fs   = require('path');
const path = require('path');
const roar = require('roar-cli');

export default class CLI extends roar.CLI {
  get example() {
    return 'tiny-lr [options]';
  }

  get more() {
    return `
  Examples:

    $ tiny-lr -p 3000
    $ tiny-lr ./site
    $ tiny-lr -wg '**/*.{html,css,js}'
`;
  }

  // Used to parse arguments with minimist
  get alias() {
    return {
      h: 'help',
      v: 'version',
      p: 'port'
      //   .option('--cert <path>', 'Path to the TLS certificate file (default: ./cert.pem)', String)
      //   .option('--key <path>', 'Path to the TLS key file (default: ./key.pem)', String)
    };
  }

  // Used to generate the help output, along with example / more above
  get flags() {
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
  }
}
