/* watch for file changes to trigger a rebuild */
var config = require('../config'),
    gulp = require('gulp');

gulp.task('watch', function () {
    gulp.watch(config.source.sass, ['sass']);
    gulp.watch(config.source.html, ['html']);
    gulp.watch(config.source.images, ['images']);
});