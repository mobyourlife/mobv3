/* bump package version */
var config = require('../config'),
    gulp = require('gulp'),
    bump = require('gulp-bump');

gulp.task('version', function () {
    gulp.src(['./bower.json', './package.json'])
        .pipe(bump({ type: 'patch' }))
        .pipe(gulp.dest('./'));
});