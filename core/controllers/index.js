'use strict';

var currentLanguage = require('../lib/current-language');

module.exports = function (router) {

    router.get('/', function (req, res) {
        var model = currentLanguage(req);
        model.background = 'bg-' + ((Math.round((Date.now() / 1000) / 1800) % 15) + 1);
        res.render('index', model);
    });

};
