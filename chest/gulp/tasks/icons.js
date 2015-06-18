/* deploy icon fonts */
var config = require('../config'),
    gulp = require('gulp'),
    debug = require('gulp-debug');

gulp.task('icons', function () {
    gulp.src(config.includes.fonts)
        .pipe(gulp.dest(config.dist.fonts))
        .pipe(debug());
});