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
      loader: "react-hot-loader"
    },
    {
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        presets: ['react', 'es2015', 'stage-0']
      }
    },
    {
      test: /\.less$/,
      loader: "style-loader!css-loader!autoprefixer-loader!less-loader"
    }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  devServer: {
    historyApiFallback: true,
    contentBase: PATHS.dist
  }
};
