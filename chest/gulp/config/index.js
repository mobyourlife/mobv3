/* base paths */
var src = './src';
var dist = './dist';
var bower = './bower_components/';
var lib = './lib/';

/* setup bower components */
var constants = require('./constants');
var wildcards = constants.wildcards;
var modules = require('./modules');

/* initialise includes */
var includes = {
    css: [],
    fonts: [],
    images: [],
    js: [],
    jsconcats: [],
    sass: []
};

/* select root path between bower and lib */
var getRootPath = function (module) {
    if (module.type && module.type === 'lib') {
        return lib;
    } else {
        return bower;
    }
}

/* setup includes */
for (var i = 0; i < modules.length; i++) {
    /* assume default base path */
    if (!modules[i].base_path) {
        modules[i].base_path = '';
    }

    /* setup full relative path */
    var root_path = getRootPath(modules[i]);
    var base_path = root_path + modules[i].name + '/' + modules[i].base_path;

    /* include css */
    if (modules[i].css) {
        includes.css.push(base_path + modules[i].css);
    }

    /* include css */
    if (modules[i].fonts) {
        includes.fonts.push(base_path + modules[i].fonts);
    }

    /* include images */
    if (modules[i].images) {
        includes.images.push(base_path + modules[i].images);
    }

    /* include js */
    if (modules[i].js) {
        includes.js.push(base_path + modules[i].js);
    }

    /* include js concats */
    if (modules[i].jsconcat) {
        var item = modules[i].jsconcat;
        item.base_path = base_path + item.base_path;
        
        for (var j = 0; j < item.src.length; j++) {
            item.src[j] = item.base_path + item.src[j];
        }
        
        includes.jsconcats.push(item);
    }

    /* include sass */
    if (modules[i].sass) {
        includes.sass.push(base_path + modules[i].sass);
    }
}

/* export config */
module.exports = {
    includes: includes,

    source: {
        html: src + '/*.' + wildcards.html,
        sass: src + '/sass/*.' + wildcards.sass
    },

    dist: {
        css: dist + '/css',
        fonts: dist + '/fonts',
        html: dist,
        images: dist + '/images',
        js: dist + '/js'
    }
};