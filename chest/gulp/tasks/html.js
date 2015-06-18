/* deploy icon fonts */
var config = require('../config'),
    gulp = require('gulp'),
    debug = require('gulp-debug'),
    livereload = require('gulp-livereload');

gulp.task('html', function () {
    gulp.src(config.source.html)
        .pipe(gulp.dest(config.dist.html))
        .pipe(debug())
        .pipe(livereload());
});