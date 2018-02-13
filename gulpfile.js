const {
  task,
  src,
  dest,
  parallel,
  series,
  watch,
} = require('gulp');

// gulp plugins
const {
  plumber,
  pug,
  imagemin,
  stylus,
  svgo,
} = require('gulp-load-plugins')();
const webpack = require('webpack-stream');

// webpack plugins
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// stylus plugins
const poststylus = require('poststylus');

// postcss plugins
const autoprefixer = require('autoprefixer');
const rucksack = require('rucksack-css');
const lost = require('lost');
const mediaQueries = require('postcss-easy-media-query');
const csswring = require('csswring');

// browser-sync
const { init, reload } = require('browser-sync').create();

// misc helpers
const del = require('del');

// task functions
const images = () =>
  src('./images/*')
    .pipe(plumber())
    .pipe(imagemin())
    .pipe(dest('./build/images'));

const pages = () =>
  src('./pages/*.pug')
    .pipe(plumber())
    .pipe(pug())
    .pipe(dest('./build'));

const scripts = () =>
  src('./scripts/main.js')
    .pipe(plumber())
    .pipe(webpack({
      output: {
        filename: './main.js',
      },
      devtool: 'source-map',
      plugins: [
        new UglifyJsPlugin(),
      ],
      module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: '/node_modules/',
            loader: 'babel-loader',
            query: {
              presets: ['env'],
            },
          },
        ],
      },
    }))
    .pipe(dest('./build/scripts'));

const styles = () =>
  src('./styles/main.styl')
    .pipe(plumber())
    .pipe(stylus({
      use: [
        poststylus([
          mediaQueries,
          rucksack,
          lost,
          autoprefixer({ browsers: 'last 3 version' }),
          csswring,
        ]),
      ],
    }))
    .pipe(dest('./build/styles'));

const vectors = () =>
  src('./vectors/*.svg')
    .pipe(plumber())
    .pipe(svgo())
    .pipe(dest('./pages/partials'));

// server functions
const server = (done) => {
  init({
    server: {
      baseDir: './build',
    },
  });
  done();
};

const refresh = (done) => {
  reload();
  done();
};

// utility functions
const clean = () => del('./build');

const watcher = () => {
  watch('./images/*', series(images, refresh));
  watch('./pages/**/*', series(pages, refresh));
  watch('./scripts/**/*', series(scripts, refresh));
  watch('./styles/**/*', series(styles, refresh));
  watch('./vectors/*', series(vectors, refresh));
};

// tasks
task('build', series(
  clean,
  images,
  pages,
  scripts,
  styles,
  vectors,
));

task('serve', series('build', parallel(watcher, server)));
