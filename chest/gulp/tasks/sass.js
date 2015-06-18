/* build sass stylesheets and deploy css */
var config = require('../config'),
    gulp = require('gulp'),
    debug = require('gulp-debug'),
    livereload = require('gulp-livereload'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    minify = require('gulp-minify-css'),
    rename = require('gulp-rename');

gulp.task('sass', function () {
    gulp.src(config.source.sass)
        .pipe(sass({ includePaths: config.includes.sass }))
        .pipe(gulp.dest(config.dist.css))
        .pipe(debug())
        .pipe(sourcemaps.init())
        .pipe(minify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(debug())
        .pipe(gulp.dest(config.dist.css))
        .pipe(livereload());
});