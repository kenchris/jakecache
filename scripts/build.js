var rollup = require("rollup");
var resolve = require("rollup-plugin-node-resolve");
var commonjs = require("rollup-plugin-commonjs");

var files = ["jakecache-sw.js", "jakecache.js"];

files.forEach(function(file) {
  rollup
    .rollup({
      entry: file
    })
    .then(function(bundle) {
      bundle.write({
        format: "cjs",
        dest: "dist/" + file,
        plugins: [resolve(), commonjs()]
      });
    })
    .catch(function(e) {
      console.error(e, e.stack);
    });
});
