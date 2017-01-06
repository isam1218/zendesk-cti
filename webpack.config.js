var path = require('path');

const PATHS = {
  app: './src/index.js',
  html: './src/index.html',
  dist: path.join(__dirname, 'app', 'assets')
};

module.exports = {
  entry: {
    javascript: PATHS.app
  },
  output: {
    path: PATHS.dist,
    publicPath: '/',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
    {
      test: /\.html$/,
      loader: "file?name=[name].ext"
    },
    {
      test: /\.(js|jsx)/,
      exclude: /node_modules/,
      loader: "react-hot"
    },
    {
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: ['react', 'es2015', 'stage-0']
      }
    },
    {
      test: /\.less$/,
      loader: "style!css!autoprefixer!less"
    }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  devServer: {
    historyApiFallback: true,
    contentBase: PATHS.dist
  }
};
