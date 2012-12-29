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
          tasks: 'tinylr-reload'
        }
      }
    });

    grunt.loadTasks('../../tasks');

    grunt.registerTask('reload', 'tinylr-start watch');
};
