'use strict';

var Server = require('../..');

module.exports = function (grunt) {
    // Load all grunt tasks

    grunt.initConfig({
        watch: {
          reload: {
              files: [
                '**/*.html',
                '**/styles/*.css',
                '**/scripts/*.js',
                '**/images/*.{png,jpg,jpeg}'

                // '**/*.html',
                // '**/styles/*.css',
                // '**/scripts/*.js',
                // '**/images/*.{png,jpg,jpeg}'
              ],
              tasks: 'reload-change'
            }
        },
    });

    var server;
    grunt.registerTask('reload-start', '', function () {
        server = new Server();
        server.listen('9000', this.async());
    });

    grunt.registerTask('reload-change', '', function () {
        if(!server) return;
        server.changed({
          body: {
            files: grunt.file.watchFiles.changed
          }
        });
    });

    grunt.registerTask('reload', ['reload-start', 'watch:reload']);
};
