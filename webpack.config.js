const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "crypto": false,
      "path": false,
      "os": false,
      "fs": false,
      "stream": false,
      "http": false,
      "https": false,
      "zlib": false,
      "url": false,
      "util": false,
      "assert": false,
      "buffer": false
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Face Mesh Point Cloud',
      template: 'src/index.html',
    }),
  ],
  devServer: {
    static: path.join(__dirname, 'public'),
    compress: true,
    port: 4001,
  },
}; 