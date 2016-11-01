var rollup = require('rollup')
var babel = require('rollup-plugin-babel')

var files = ['jakecache-sw.js', 'jakecache.js']

files.forEach(function(file) {

  rollup.rollup({
    entry: file,
      plugins: [
        babel()
      ]
  }).then( function ( bundle ) {

    bundle.write({
      format: 'cjs',
      dest: 'dist/' + file
    });

  }).catch(function(e) {
    console.error(e, e.stack)
  })

})
