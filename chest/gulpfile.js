var requireDir = require('require-dir');

requireDir('./gulp/builds', {
    recurse: true
});

requireDir('./gulp/tasks', {
    recurse: true
});