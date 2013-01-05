
var Server = require('..');

// Basic grunt facade to tiny-lr server.
//
// XXX: Consider
//
// - spawning the server in the background.
// - changing the reload target to use HTTP requests to notify the server.
// - providing a `tinylr-stop` task.
//
// Examples
//
//      grunt tinylr-start &
//      grunt tinylr-reload:path/to/asset.ext[,...]
//

module.exports = function(grunt) {
  var util = grunt.util || grunt.utils;
  var _ = util._;

  // server instance
  var server;

  // Task to start up a new tiny-lr Server, with the provided port.
  //
  // - options - Hash of options in Gruntfile `tiny-lr` prop with the following
  //             properties
  //             :port - The port to listen on (defaults: 35729)
  //
  grunt.registerTask('tinylr-start', 'Start the tiny livereload server', function() {
    var options = _.defaults(grunt.config('tiny-lr') || {}, {
      port: 35729

    });

    var done = this.async();
    server = new Server();
    grunt.log.writeln('... Starting server on ' + options.port + ' ...');
    server.listen(options.port, this.async());
  });

  // Task to send a reload notification to the previously started server.
  //
  // This should be configured as a "watch" task in your Gruntfile, and run
  // after tinylr-start.
  //
  // Example
  //
  //      watch: {
  //        reload: {
  //          files: ['**/*.html', '**/*.js', '**/*.css', '**/*.{png,jpg}'],
  //          tasks: 'tinylr-reload'
  //        }
  //      }
  //
  grunt.registerTask('tinylr-reload', 'Sends a reload notification to the livereload server, based on `watchFiles.changed`', function() {
    if(!server) return;
    server.changed({
      body: {
        files: grunt.file.watchFiles.changed
      }
    });
  });

};
