'use strict';

var Fanpage = require('../../models/fanpage');


module.exports = function (router) {

    router.get('/my-sites', function (req, res) {
        
        Fanpage.find({}).sort({ 'facebook.name': 1 }).exec(function(err, rows) {
            
            if (err) {
                console.log(err);
            }
            
            var model = {
                sites: rows
            };
            
            res.send(model);
        });
        
    });

};