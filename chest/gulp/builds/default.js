var gulp = require('gulp');

gulp.task('default', [
    'icons',
    'images',
    'javascripts',
    'jsconcats',
    'sass',
    'html',
    'develop',
    'watch'
]);