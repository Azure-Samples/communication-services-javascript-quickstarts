module.exports = {
  devServer: {
    allowedHosts: "auto",
    client: {
      overlay: true,
    },
  },
  entry: "./client.js",
  output: {
    filename: "bundle.js",
  },
  devtool: "inline-source-map",
  mode: "development",
};
