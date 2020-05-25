import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = false; //!process.env.ROLLUP_WATCH;

export default [
  {
    input: "jakecache-sw.js",
    output: {
      file: "dist/jakecache-sw.js",
      format: "cjs",
    },
    plugins: [
      resolve(), // tells Rollup how to find date-fns in node_modules
      commonjs(), // converts date-fns to ES modules
      production && terser(), // minify, but only in production
    ],
  },
  {
    input: "jakecache.js",
    output: {
      file: "dist/jakecache.js",
      format: "cjs",
    },
    plugins: [
      resolve(), // tells Rollup how to find date-fns in node_modules
      commonjs(), // converts date-fns to ES modules
      production && terser(), // minify, but only in production
    ],
  },
];

var files = ["jakecache-sw.js", "jakecache.js"];
