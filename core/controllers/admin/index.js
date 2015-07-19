'use strict';

var currentLanguage = require('../../lib/current-language');
var Fanpage = require('../../models/fanpage');
var AdminPerms = require('../../lib/admin-perms');

module.exports = function (router) {

    router.get('/', function (req, res) {
        
        if (!req.isAuthenticated()) {
            res.redirect('/');
        } else {
            var model = currentLanguage(req);
            model.user = req.user;
            model.admin = AdminPerms.isAdmin(req.user);
            
            res.render('admin', model);
        }
    });

};
