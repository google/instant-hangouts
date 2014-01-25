// Use grunt to produce top-level javascript files, but not to run tests (Karma
// has its own watcher).

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          hostname: 'localhost',
          port: 8080
        }
      }
    },
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

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-wrap');

  grunt.registerTask('default', ['uglify', 'wrap', 'connect', 'watch']);
}
