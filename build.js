var rollup = require('rollup')

var files = ['jakecache-sw.js', 'jakecache.js']

files.forEach(function(file) {

  rollup.rollup({
    entry: file
  }).then( function ( bundle ) {

    bundle.write({
      format: 'cjs',
      dest: 'dist/' + file
    });

  }).catch(function(e) {
    console.error(e, e.stack)
  })

})
