
var nopt   = require('nopt');
var util   = require('util');
var events = require('events');

module.exports = noptify;
noptify.Noptify = Noptify;

function noptify(args, options) {
  return new Noptify(args, options);
}

function Noptify(args, options) {
  events.EventEmitter.call(this);
  options = this.options = options || {};
  this.args = args || process.argv;
  this.program = options.program || this.args.slice(0, 2).join(' ');

  this.option('help', '-h', 'Show help usage');
  this.option('version', '-v', 'Show package version');
}

util.inherits(Noptify, events.EventEmitter);

Noptify.prototype.parse = function parse(argv) {
  argv = argv || this.args;
  var options = this._options.reduce(function(opts, opt) {
    opts[opt.name] = opt.type;
    return opts;
  }, {});

  var shorthands = this._options.reduce(function(opts, opt) {
    if(opt.shorthand) opts[opt.shorthand] = '--' + opt.name;
    return opts;
  }, {});

  var opts = nopt(options, shorthands, argv);
  if(opts.version) {
    console.log(this._version);
    process.exit(0);
  }


  if(opts.help) {
    this.help();
    this.emit('help');
    process.exit(0);
  }

  return opts;
};

Noptify.prototype.version = function(ver) {
  this._version = ver;
  return this;
};

// Define option with flags, description.

Noptify.prototype.option = function option(name, shorthand, description, type) {
  this._options = this._options || [];
  if(!description) {
    description = shorthand;
    shorthand = '';
  }

  if(!type) {
    if(typeof description === 'function') {
      type = description;
      description = shorthand;
      shorthand = '';
    } else {
      type = String;
    }
  }

  shorthand = shorthand.replace(/^-*/, ''),

  this._options.push({
    name: name,
    shorthand: shorthand.replace(/^-*/, ''),
    description: description,
    usage: (shorthand ? '-' + shorthand + ', ': '' ) + '--' + name,
    type: type
  });

  return this;
};

Noptify.prototype.help = function help() {
  var buf = '';
  buf += '\n  Usage: ' + this.program + ' [options]'
  buf += '\n';
  buf += '\n  Options:\n';

  var maxln = Math.max.apply(Math, this._options.map(function(opts) {
    return opts.usage.length;
  }));

  var options = this._options.map(function(opts) {
    return '    ' + pad(opts.usage, maxln + 5) + ' - ' + opts.description;
  });

  buf += options.join('\n');
  buf += '\n';

  console.log(buf);
};


function pad(str, max) {
  var ln = max - str.length;
  return ln > 0 ? str + new Array(ln).join(' ') : str;
}
