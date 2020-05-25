// var rollup = require("rollup");
// var resolve = require("rollup-plugin-node-resolve");
import resolve from "@rollup/plugin-node-resolve";

var files = ["jakecache-sw.js", "jakecache.js"];

export default [
  {
    input: "jakecache-sw.js",
    output: {
      file: "dist/jakecache-sw.js",
      format: "cjs",
    },
    plugins: [resolve()],
  },
  {
    input: "jakecache.js",
    output: {
      file: "dist/jakecache.js",
      format: "cjs",
    },
    plugins: [resolve()],
  },
];

// files.forEach(function (file) {
//   rollup
//     .rollup({
//       entry: file,
//     })
//     .then(function (bundle) {
//       bundle.write({
//         format: "cjs",
//         dest: "dist/" + file,
//         plugins: [resolve(), commonjs(), async()],
//       });
//     })
//     .catch(function (e) {
//       console.error(e, e.stack);
//     });
// });
