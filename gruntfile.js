/*jslint node: true */
'use strict';

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: [
        'lib/*',
      ],
      options: {
        esversion: 6,
        multistr: true,
        node: true,
        asi: true,
        lastsemic: false,
        '-W032': true,
        '-W099': true,
        '-W004': true,
        globals: {
          Map: true,
        }
      }
    },
  });

  // Default task.
  grunt.registerTask('default', ['jshint:all']);
};