'use strict';

var currentLanguage = require('../lib/current-language');

module.exports = function (router) {

    router.get('/', function (req, res) {
        var model = currentLanguage(req);
        res.render('index', model);
    });

};
