'use strict';

var FB = require('FB');
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
    
    /* new website creation */
    router.get('/create-new-website/:pageid', function (req, res) {
        if (req.isAuthenticated()) {
            FB.api('/' + req.params.pageid, { locale: req.cookies.locale }, function(data) {
                if (data.error) {
                    console.log(data.error);
                }
                
                console.log(data);
                
                res.status(400).send();
            });
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
    
    /* website creation wizard */
    router.get('/wizard/website-created/:pageid', function (req, res) {
        if (req.isAuthenticated()) {
            Fanpage.update({ _id: req.params.pageid }, { 'wizard.current_step': 2, 'wizard.site_created': true }, function (err) {
                if (err) {
                    console.log(err);
                }
                
                res.send();
            });
        }
    });
    
    router.get('/wizard/personal-touch/:pageid/:colour', function (req, res) {
        if (req.isAuthenticated()) {
            Fanpage.update({ _id: req.params.pageid }, { 'wizard.current_step': 3, 'wizard.personal_touch': true, 'theme.name': 'default', 'theme.colour': req.params.colour }, function (err) {
                if (err) {
                    console.log(err);
                }
                
                res.send();
            });
        }
    });
    
    router.get('/wizard/website-shared/:pageid', function (req, res) {
        if (req.isAuthenticated()) {
            Fanpage.update({ _id: req.params.pageid }, { 'wizard.current_step': 4, 'wizard.share_it': true }, function (err) {
                if (err) {
                    console.log(err);
                }
                
                res.send();
            });
        }
    });
    
    router.get('/wizard/website-finished/:pageid', function (req, res) {
        if (req.isAuthenticated()) {
            Fanpage.update({ _id: req.params.pageid }, { 'wizard.current_step': 5, 'wizard.finished': true }, function (err) {
                if (err) {
                    console.log(err);
                }
                
                res.send();
            });
        }
    });

};
