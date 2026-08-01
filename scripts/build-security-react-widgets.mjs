import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const webpackBundle = require("next/dist/compiled/webpack/webpack");
if (typeof webpackBundle.init === "function") webpackBundle.init();
const webpack = webpackBundle.webpack || webpackBundle;

if (typeof webpack !== "function") {
  throw new TypeError("Next's bundled webpack compiler is unavailable");
}

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, "..");
const securityRoot = path.join(repoRoot, "site", "school", "security");

const compiler = webpack({
  mode: "production",
  target: ["web", "es2020"],
  entry: path.join(securityRoot, "react-widgets.entry.js"),
  output: {
    path: securityRoot,
    filename: "react-widgets.js",
    clean: false,
  },
  devtool: false,
  performance: { hints: false },
  optimization: {
    minimize: true,
    splitChunks: false,
    runtimeChunk: false,
  },
  resolve: {
    extensions: [".js"],
  },
});

const stats = await new Promise((resolve, reject) => {
  compiler.run((error, result) => {
    if (error) return reject(error);
    if (!result) return reject(new Error("Webpack returned no compilation result"));
    resolve(result);
  });
});

await new Promise((resolve, reject) => {
  compiler.close((error) => error ? reject(error) : resolve());
});

if (stats.hasErrors()) {
  console.error(stats.toString({ all: false, errors: true, errorDetails: true }));
  process.exit(1);
}

console.log("security-react-widgets: bundled local React islands");
