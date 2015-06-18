/* BOWER MODULES SETUP
 * ===================
 */
var constants = require('./constants');
var wildcards = constants.wildcards;

var modules = [
    /* AngularJS */
    {
        name: 'angular',
        js: '/angular.' + wildcards.js,
    },

    /* Angular Route */
    {
        name: 'angular-route',
        js: 'angular-route.' + wildcards.js
    },

    /* Bootstrap */
    {
        type: 'lib',
        name: 'bootstrap-sass',
        base_path: 'assets/',
        images: 'images/' + wildcards.all_files,
        jsconcat: {
            base_path: 'javascripts/bootstrap/',
            src: [
                'carousel.js'
            ],
            dist: 'bootstrap.js'
        },
        sass: 'stylesheets/'
    },

    /* Font Awesome */
    {
        name: 'fontawesome',
        css: 'css/' + wildcards.all_files,
        fonts: 'fonts/' + wildcards.all_files
    },

    /* Modernizr */
    {
        name: 'modernizr',
        js: 'modernizr.' + wildcards.js
    },

    /* Respond */
    {
        name: 'respond',
        base_path: 'dest/',
        js: 'respond.' + wildcards.js
    }
];

module.exports = modules;