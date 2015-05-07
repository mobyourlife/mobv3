'use strict';

var currentLanguage = require('../../lib/current-language');
var Fanpage = require('../../models/fanpage');

module.exports = function (router) {

    router.get('/', function (req, res) {
        
        if (!req.isAuthenticated()) {
            res.redirect('/');
        } else {
            var model = currentLanguage(req);
            model.user = req.user;
            
            if (model.user.facebook && model.user.facebook.email) {
                var allowed = [
                    'contato@fmoliveira.com.br',
                    'marcelofante01@gmail.com',
                    'latorremarcelo08@gmail.com'
                ];
                
                for (var i = 0; i < allowed.length; i++) {
                    if (allowed[i].localeCompare(model.user.facebook.email) == 0) {
                        model.admin = true;
                        break;
                    }
                }
            }
            
            res.render('admin', model);
        }
    });

};
