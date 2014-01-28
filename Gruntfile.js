// Use grunt to produce top-level javascript files, but not to run tests (Karma
// has its own watcher).

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      js: {
        files: {
          'instanthangouts-<%= pkg.version %>.js':
              ['instanthangouts-<%= pkg.version %>.uncompiled.js']
        }
      }
    },
    watch: {
      files: ['*.html', 'src/*.js', 'test/*.js'],
      tasks: ['wrap', 'uglify']
    },
    wrap: {
      js: {
        src: ['src/*.js'],
        dest: 'instanthangouts-<%= pkg.version %>.uncompiled.js',
        options: {
          indent: '  ',
          wrapper: ['(function () {\n', '}());\n']
        }
      }
    }
  });

  grunt.registerTask('default', ['wrap', 'uglify', 'watch']);
}
