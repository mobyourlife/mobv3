'use strict';

var currentLanguage = require('../../lib/current-language');
var Fanpage = require('../../models/fanpage');

module.exports = function (router) {

    router.get('/', function (req, res) {
        var model = currentLanguage(req);
        res.render('admin', model);
    });

};
