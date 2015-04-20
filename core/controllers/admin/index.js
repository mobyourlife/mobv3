'use strict';

var Fanpage = require('../../models/fanpage');

var getCountryFlag = function(language) {
    switch(language) {
        case 'pt-BR':
            return 'br';

        case 'en-UK':
        default:
            return 'gb';
    }
}

module.exports = function (router) {

    router.get('/', function (req, res) {
        
        Fanpage.find({}).sort({ 'facebook.name': 1 }).exec(function(err, rows) {
            
            if (err) {
                console.log(err);
            }
            
            var model = {
                active: 'dashboard',
                language: req.cookies.locale,
                country: getCountryFlag(req.cookies.locale),
                sites: rows
            };
            
            res.render('admin', model);
        });
        
    });
    
    
    
    router.get('/:pageid', function (req, res) {
        
        Fanpage.findOne({ _id: req.params.pageid }, function(err, row) {
            
            if (err) {
                console.log(err);
            }
            
            var model = {
                active: 'dashboard',
                site: row
            };
            
            res.render('admin/site', model);
        });
        
    });

};
