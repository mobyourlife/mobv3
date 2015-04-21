'use strict';

var Fanpage = require('../../models/fanpage');


module.exports = function (router) {

    /* api method to list all user created sites */
    router.get('/my-sites', function (req, res) {
        if (req.isAuthenticated() && req.user && req.user.fanpages) {
            var list = Array();
            
            for(var i = 0; i < req.user.fanpages.length; i++) {
                list.push(req.user.fanpages[i].id);
            }
            
            Fanpage.find({ _id: { $in: list } }).sort({ 'facebook.name': 1 }).exec(function(err, rows) {
                if (err) {
                    console.log(err);
                }

                var model = {
                    sites: rows
                };

                res.send(model);
            });
        } else {
            res.status(401).send();
        }
    });
    
    /* api method to get details about a single user site */
    router.get('/manage-site/:pageid', function (req, res) {
        if (req.isAuthenticated()) {
            Fanpage.findOne({ _id: req.params.pageid }, function(err, model) {
                if (err) {
                    console.log(err);
                }

                res.send(model);
            });
        } else {
            res.status(401).send();
        }
    });

};
