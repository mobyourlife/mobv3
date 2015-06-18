/* deploy javascripts */
var config = require('../config'),
    gulp = require('gulp'),
    debug = require('gulp-debug');

gulp.task('javascripts', function () {
    gulp.src(config.includes.js)
        .pipe(gulp.dest(config.dist.js))
        .pipe(debug());
});