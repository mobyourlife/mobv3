/* deploy javascripts */
var config = require('../config'),
    gulp = require('gulp'),
    debug = require('gulp-debug'),
    concat = require('gulp-concat'),
    livereload = require('gulp-livereload'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    minify = require('gulp-minify-css'),
    rename = require('gulp-rename');

gulp.task('jsconcats', function () {
    for (var i = 0; i < config.includes.jsconcats.length; i++) {
        gulp.src(config.includes.jsconcats[i].src)
            .pipe(concat(config.includes.jsconcats[i].dist))
            .pipe(gulp.dest(config.dist.js))
            .pipe(debug())
            .pipe(sourcemaps.init())
            .pipe(uglify())
            .pipe(rename({
                suffix: '.min'
            }))
            .pipe(sourcemaps.write('./'))
            .pipe(debug())
            .pipe(gulp.dest(config.dist.js))
            .pipe(livereload());
    }
});