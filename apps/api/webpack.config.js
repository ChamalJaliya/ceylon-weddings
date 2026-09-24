const path = require("node:path");
const nodeExternals = require("webpack-node-externals");

function enableTranspileOnly(options) {
  const rules = options.module?.rules ?? [];
  for (const rule of rules) {
    const uses = [rule, ...(Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : [])];
    for (const use of uses) {
      const loader = typeof use === "string" ? use : use?.loader;
      if (loader && String(loader).includes("ts-loader")) {
        use.options = { ...(use.options ?? {}), transpileOnly: true };
      }
    }
  }
}

module.exports = function (options) {
  enableTranspileOnly(options);
  return {
    ...options,
    externals: [
      nodeExternals({
        allowlist: [/^@ceylonweddings\//, /^webpack\/hot/],
      }),
    ],
    resolve: {
      ...options.resolve,
      alias: {
        ...(options.resolve?.alias ?? {}),
        "@ceylonweddings/contracts": path.resolve(__dirname, "../../packages/contracts/src/index.ts"),
        "@ceylonweddings/env": path.resolve(__dirname, "../../packages/env/src/index.ts"),
        "@ceylonweddings/database": path.resolve(__dirname, "../../packages/database/src/index.ts"),
      },
      extensionAlias: {
        ".js": [".ts", ".js"],
      },
    },
  };
};
