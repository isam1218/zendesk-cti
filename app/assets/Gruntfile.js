module.exports = function(grunt) {
	grunt.initConfig({
		concat: {
			js: {
				src: ['components/*.jsx', 'index.js'],
				dest: 'bundle/components.js'
			}
		},
		babel: {
			options: {
				presets: ['react', 'es2015', 'stage-0']
			},
			dist: {
				files: {
					'bundle/components.js': 'bundle/components.js'
				}
			}
		},
		less: {
			options: {
				compress: true
			},
			dist: {
				files: {
					"bundle/styles.css": "styles/main.less"
				}
			}
		},
		watch: {
			css: {
				files: ['styles/*.less'],
				tasks: ['less']
			},
			js: {
				files: ['components/*.jsx', 'index.js'],
				tasks: ['concat', 'babel']
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-babel');
	
	// bundle app files
	grunt.registerTask('default', ['concat', 'babel', 'less']);
};