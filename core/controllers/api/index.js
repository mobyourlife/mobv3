'use strict';

var FB = require('FB');
var moment = require('moment');
var unirest = require('unirest');
var Domain = require('../../models/domain');
var Fanpage = require('../../models/fanpage');
var Ticket = require('../../models/ticket');
var email = require('../../lib/email')();
var sync = require('../../lib/sync')();

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
    
    /* api method to list all user billing tickets */
    router.get('/billing', function (req, res) {
        if (req.isAuthenticated() && req.user && req.user.fanpages) {
            var list = Array();
            var names = Array();
            
            for(var i = 0; i < req.user.fanpages.length; i++) {
                list.push(req.user.fanpages[i].id);
                names[req.user.fanpages[i].id] = req.user.fanpages[i].name;
            }
            
            Ticket.find({ ref: { $in: list } }).sort({ 'time': -1 }).exec(function(err, rows) {
                var ret = Array();
                
                for (var j = 0; j < rows.length; j++) {
                    ret.push({
                        fanpage: {
                            id: rows[j].ref,
                            name: names[rows[j].ref]
                        },
                        ticket: rows[j]
                    });
                }
                
                res.status(200).send({ tickets: ret });
            });
        }
    });
    
    /* api method to list all user fanpages without sites */
    router.get('/remaining-fanpages', function (req, res) {
        if (req.isAuthenticated() && req.user && req.user.fanpages) {
            FB.setAccessToken(req.user.facebook.token);
            FB.api('/me/permissions', function(records) {
                var required = ['public_profile', 'email', 'manage_pages'];
                var pending = [];

                for (var i = 0; i < records.data.length; i++) {
                    var perm = records.data[i];
                    if (required.indexOf(perm.permission) != -1) {
                        if (perm.status != 'granted') {
                            switch (perm.permission) {
                                case 'public_profile':
                                    pending.push('Perfil público');
                                    break;

                                case 'email':
                                    pending.push('Endereço de email');
                                    break;

                                case 'manage_pages':
                                    pending.push('Gerenciar páginas');
                                    break;

                                default:
                                    break;
                            }
                        }
                    }
                }

                if (pending.length != 0) {
                    res.status(401).send({ pending: pending });
                    return;
                }

                FB.api('/me/accounts', { locale: 'pt_BR', fields: ['id', 'name', 'about', 'link', 'picture'] }, function(records) {
                    if (records.data) {
                        var pages_list = Array();
                        var ids_list = Array();

                        for (var r = 0; r < records.data.length; r++) {
                            var item = {
                                id: records.data[r].id,
                                name: records.data[r].name,
                                about: records.data[r].about,
                                link: records.data[r].link,
                                picture: records.data[r].picture.data.url
                            };
                            pages_list.push(item);
                            ids_list.push(records.data[r].id);
                        }

                        pages_list.sort(function(a, b) {
                            var x = a.name.toLowerCase(), y = b.name.toLowerCase();
                            if (x < y) return -1;
                            if (x > y) return 1;
                            return 0;
                        });

                        Fanpage.find({ _id: { $in: ids_list } }, function(err, records) {
                            var built_list = Array();

                            if (records) {
                                for (i = 0; i < pages_list.length; i++) {
                                    var existe = false;

                                    for (var j = 0; j < records.length; j++) {
                                        if (pages_list[i].id == records[j]._id) {
                                            existe = true;
                                        }
                                    }

                                    if (existe === false) {
                                        built_list.push(pages_list[i]);
                                    }
                                }
                            } else {
                                built_list = pages_list;
                            }

                            res.status(200).send({ pages: built_list });
                        });
                    }
                });
            });
        }
    });
    
    /* new website creation */
    router.get('/create-new-website/:pageid', function (req, res) {
        if (req.isAuthenticated()) {
            FB.setAccessToken(req.user.facebook.token);
            FB.api('/' + req.params.pageid, { locale: 'pt_BR', fields: ['id', 'name', 'about', 'link', 'picture', 'access_token'] }, function(records) {
                
                if (records) {
                    FB.setAccessToken(records.access_token);
                    FB.api('/v2.2/' + records.id + '/subscribed_apps', 'post', function(ret) {
                        Fanpage.findOne({ _id : records.id }, function(err, found) {
                            var newFanpage = null;

                            if (found) {
                                newFanpage = found;
                            } else {
                                newFanpage = new Fanpage();
                                newFanpage._id = records.id;
                                newFanpage.facebook.name = records.name;
                                newFanpage.facebook.about = records.about;
                                newFanpage.facebook.link = records.link;
                                newFanpage.url = newFanpage.facebook.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '') + '.meusitemob.com.br';
                                
                                if (records.picture && records.picture.data) {
                                    newFanpage.facebook.picture = records.picture.data.url;
                                }

                                /* creation info */
                                newFanpage.creation.time = Date.now();
                                newFanpage.creation.user = req.user;

                                /* billing info */
                                var ticket = new Ticket();
                                ticket.ref = newFanpage._id;
                                ticket.time = Date.now();
                                ticket.validity.months = 0;
                                ticket.validity.days = 7;
                                ticket.coupon.reason = 'signup_freebie';

                                newFanpage.billing.active = true;
                                newFanpage.billing.evaluation = true;
                                newFanpage.billing.expiration = moment()
                                    .add(ticket.validity.months, 'months')
                                    .add(ticket.validity.days, 'days');

                                ticket.save(function(err) {
                                    if (err)
                                        throw err;
                                });
                            }

                            // save the new fanpage to the database
                            Fanpage.update({ _id: records.id }, newFanpage.toObject(), { upsert: true }, function(err) {
                                if (err)
                                    throw err;

                                // start syncing fanpage's current data
                                sync.syncFanpage(newFanpage);

                                // create default subdomain
                                var domain = new Domain();
                                domain._id = newFanpage.url;
                                domain.ref = newFanpage;
                                domain.status = 'registered';
                                domain.creation.time = Date.now();
                                domain.creation.user = req.user._id;

                                Domain.update({ _id: domain._id }, domain.toObject(), { upsert: true }, function(err) {
                                    if (err)
                                        throw err;

                                    // send welcome email
                                    var filename = '/var/www/mob/email/bem-vindo.html';
                                    //var filename = './email/bem-vindo.html';

                                    if (req.user.facebook.email) {
                                        email.montarEmail(filename, newFanpage._id, function(html, user_email) {
                                            email.enviarEmail('Mob Your Life', 'nao-responder@mobyourlife.com.br', 'Bem-vindo ao Mob Your Life', html, user_email);
                                        });
                                    }

                                    res.status(200).send({ url: domain._id });
                                });
                            });
                        });
                    });
                } else {
                    res.status(400).send();
                }
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

    /* api method to list all sites from all users */
    router.get('/all-sites', function (req, res) {
        if (req.isAuthenticated() && req.user && req.user.id != 0) {
            
            Fanpage.find().sort({ 'facebook.name': 1 }).exec(function(err, rows) {
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
    
    /* whois method */
    router.get('/whois/:domain', function (req, res) {
        if (req.isAuthenticated()) {
            unirest.get('https://whois.apitruck.com/' + req.params.domain)
                .headers({
                    'Accept': 'application/json'
                })
                .end(function (response) {
                    if (response && response.body && response.body.response && response.body.response.registered == false) {
                        res.status(200).send();
                    } else {
                        res.status(500).send();
                    }
                }
            );
        } else {
            res.status(401).send();
        }
    });
    
    /* send mail method */
    router.post('/sendmail', function (req, res) {
        if (req.isAuthenticated()) {
            var subject = req.body.message.length > 20 ? req.body.message.substr(0, 20) : req.body.message;
            
            email.enviarEmail(req.body.name, req.body.email, subject, req.body.message, 'suporte@mobyourlife.com.br', function() {
                res.status(200).send();
            }, function(err) {
                console.log(err);
                res.status(500).send({ responseCode: err.responseCode, response: err.response });
            });
        }
    });
    
    /* register domain method */
    router.post('/register-domain', function (req, res) {
        if (req.isAuthenticated()) {
            var find = { _id: req.body.domain, ref: req.body.pageid };
            var item = { _id: req.body.domain, ref: req.body.pageid, status: 'waiting', 'creation.time': Date.now(), 'creation.user': req.user._id };
            
            Domain.update(find, item, { upsert: true }, function(err) {
                if (err) {
                    res.status(500).send();
                } else {
                    res.status(200).send();
                }
            });
        }
    });
    
    /* api method to list all user websites registered domains */
    router.get('/my-domains', function (req, res) {
        if (req.isAuthenticated() && req.user && req.user.fanpages) {
            var list = Array();
            var names = Array();
            
            for(var i = 0; i < req.user.fanpages.length; i++) {
                list.push(req.user.fanpages[i].id);
                names[req.user.fanpages[i].id] = req.user.fanpages[i].name;
            }
            
            Domain.find({ ref: { $in: list } }).sort({ '_id': 1 }).exec(function(err, rows) {
                var ret = Array();
                
                for (var j = 0; j < rows.length; j++) {
                    ret.push({
                        fanpage: {
                            id: rows[j].ref,
                            name: names[rows[j].ref]
                        },
                        domain: rows[j]
                    });
                }
                
                res.status(200).send({ domains: ret });
            });
        }
    });

};
