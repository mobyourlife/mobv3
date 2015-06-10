'use strict';

var FB = require('fb');
var moment = require('moment');
var unirest = require('unirest');
var URL = require('url-parse');
var ua = require('universal-analytics');

var Domain = require('../../models/domain');
var Fanpage = require('../../models/fanpage');
var Feed = require('../../models/feed');
var Ticket = require('../../models/ticket');
var TextPage = require('../../models/textpage');
var Album = require('../../models/album');
var Photo = require('../../models/photo');
var Video = require('../../models/video');
var Update = require('../../models/update');

var email = require('../../lib/email')();
var sync = require('../../lib/sync')();
var pagamento = require('../../lib/pagamento');
var themes = require('../../lib/old-themes');
var RTU = require('../../lib/realtime');

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
                                ticket.status = 'freebie';
                                ticket.validity.months = 0;
                                ticket.validity.days = 15;

                                newFanpage.billing.active = true;
                                newFanpage.billing.evaluation = true;
                                newFanpage.billing.expiration = moment()
                                    .add(ticket.validity.months, 'months')
                                    .add(ticket.validity.days, 'days');

                                ticket.save(function(err) {
                                    if (err) {
                                        console.log('Error creating ticket!');
                                        console.log(ticket);
                                        throw err;
                                    }
                                });
                            }

                            // save the new fanpage to the database
                            Fanpage.update({ _id: records.id }, newFanpage.toObject(), { upsert: true }, function(err) {
                                if (err) {
                                    console.log('Error creating fanpage!');
                                    console.log(newFanpage);
                                    throw err;
                                }

                                // create default subdomain
                                var domain = new Domain();
                                domain.ref = newFanpage;
                                domain.status = 'registered';
                                domain.creation.time = Date.now();
                                domain.creation.user = req.user;

                                Domain.update({ _id: newFanpage.url }, domain.toObject(), { upsert: true }, function(err) {
                                    if (err) {
                                        console.log('Error creating domain!');
                                        console.log(domain);
                                        throw err;
                                    }

                                    res.status(200).send({ url: domain._id });
                                    
                                    // TODO: replace for a job
                                    // send welcome email
                                    setTimeout(function() {
                                        if (req.user.facebook.email) {
                                            email.montarEmail('/var/www/mob/email/bem-vindo.html', newFanpage._id, function(html, user_email) {
                                                email.enviarEmail('Mob Your Life', 'nao-responder@mobyourlife.com.br', 'Bem-vindo ao Mob Your Life', html, user_email);
                                            });
                                        }
                                    }, (60 * 1000));
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
    
    /* api method to look for latest statistics about sites creation */
    router.get('/latest-stats', function (req, res) {
        if (req.isAuthenticated()) {
            Fanpage.find().limit(1).sort({ 'creation.time': -1 }).exec(function(err, latest) {
                if (err) {
                    console.log(err);
                }
                
                Fanpage.count().exec(function(err, count) {
                    if (err) {
                        console.log(err);
                    }
                    
                    var model = {
                        site: latest[0],
                        count: count
                    };
                    
                    res.send(model);
                });
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
    
    /* api method to call for payment */
    router.post('/make-payment', function (req, res) {
        if (req.isAuthenticated()) {
            Fanpage.findOne({ _id: req.body.pageid }, function(err, fanpage) {
                if (err) {
                    console.log(err);
                }
                
                pagamento(req.user, fanpage, 999.90, function(uri) {
                    res.status(200).send({ uri: uri });
                }, function() {
                    res.status(500).send();
                });
            });
        }
    });
    
    /* OLD API BEGINNING */
    
    /* [retro ok] */
    var validateSubdomain = function(uri, res, callbackTop, callbackSubdomain) {
        /* TODO: localizar para o idioma do site */
        moment.locale('pt-br');
        
        var parsed = uri ? new URL(uri) : null;
        var hostname = parsed ? parsed.hostname : null;
        var subdomain = hostname ? hostname.split('.')[0] : null;

        if (!hostname || hostname == 'www.mobyourlife.com.br') {
            callbackTop();
        } else {
            Domain.findOne({ '_id': hostname }, function(err, found) {
                if (found) {
                    Fanpage.findOne({'_id': found.ref}, function(err, found) {
                        if (found) {
                            var fanpage = found;

                            if (fanpage.billing.expiration <= Date.now()) {
                                res.render('expired', { fanpage: fanpage });
                                return;
                            }

                            TextPage.find({ ref: fanpage._id }, function(err, found) {
                                if (err)
                                    throw err;

                                Album.find({ ref: fanpage._id, special: 'page' }, function(err, albums) {

                                    var menu = Array();
                                    menu.push({ path: 'inicio', text: 'Início' });
                                    menu.push({ path: 'sobre', text: 'Sobre' });

                                    for (var i = 0; i < found.length; i++) {
                                        menu.push({ path: found[i].path, text: found[i].title });
                                    }

                                    for (i = 0; i < albums.length; i++) {
                                        menu.push({ path: albums[i].path, text: albums[i].name });
                                    }

                                    menu.push({ path: 'fotos', text: 'Fotos' });

                                    if (fanpage.video_count && fanpage.video_count > 0) {
                                        menu.push({ path: 'videos', text: 'Vídeos' });
                                    }

                                    menu.push({ path: 'contato', text: 'Contato' });

                                    if(!fanpage.theme) {
                                        fanpage.theme = {
                                            name: 'bootstrap',
                                            colour: 'white'
                                        };
                                    }

                                    callbackSubdomain(fanpage, menu);
                                });
                            });
                        } else {
                            res.redirect('http://www.mobyourlife.com.br');
                        }
                    });
                } else {
                    res.redirect('http://www.mobyourlife.com.br');
                }
            });
        }
    }
    
    /* [retro ok] */
    var enableCors = function(req, res, next) {
        if (req.headers.origin) {
            validateSubdomain(req.headers.origin, res, function() {
                next();
            }, function(fanpage, menu) {
                req.fanpage = fanpage;
                req.menu = menu;
                res.header('Access-Control-Allow-Origin', req.headers.origin);
                res.header('Access-Control-Allow-Credentials', true);
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                next();
            });
        } else {
            next();
        }
    }
    
    // [should be retro ok] enviar foto de capa
    router.post('/upload-cover', enableCors, function(req, res) {
        var form = new formidable.IncomingForm(), height = 0, cover = null;
        //if (app.get('env') === 'development') {
        //    form.uploadDir = './public/uploads';
        //} else {
            form.uploadDir = '/var/www/mob/public/uploads';
        //}
        form.keepExtensions = true;

        form
            .on('field', function(field, value) {
                if (field === 'height') {
                    height = value;
                }
            })
            .on('file', function(field, file) {
                if (field === 'cover') {
                    cover = file;
                }
            })
            .on('end', function() {
                var patharr = cover.path.indexOf('\\') != -1 ? cover.path.split('\\') : cover.path.split('/');
                var path = patharr[patharr.length - 1];
                Fanpage.update({ _id: req.fanpage._id }, { cover: height != 0 ? { path: path, height: height } : null }, { upsert: true}, function(err) {
                    if (err)
                        throw err;

                    res.redirect(req.headers.referer);
                });
            });
        form.parse(req);
    });
    
    // api para gerenciar álbuns
    router.post('/set-album', enableCors, function(req, res) {
        if (req.isAuthenticated()) {
            if (req.body.album_id && req.body.special_type) {
                Album.findOne({ _id: req.body.album_id }, function(err, one) {
                    if (err)
                        throw err;
                    
                    var proceed = false;
                    
                    for (var i = 0; i < req.user.fanpages.length; i++) {
                        if (req.user.fanpages[i].id.toString().localeCompare(one.ref.toString()) === 0) {
                            proceed = true;
                            break;
                        }
                    }
                    
                    if (proceed) {
                        var saveit = function() {
                            Album.update({ _id: req.body.album_id }, { special: req.body.special_type }, function(err) {
                                if (err)
                                    throw err;

                                res.status(200).send();
                            });
                        };

                        if (req.body.special_type === 'banner') {
                            Album.update({ ref: one.ref, special: 'banner' }, { special: 'default' }, function(err) {
                                if (err)
                                    throw err;

                                saveit();
                            });
                        } else {
                            saveit();
                        }
                    } else {
                        res.status(403).send();
                    }
                });
            } else {
                res.status(402).send();
            }
        }
    });
    
    /* [retro ok] api para sincronização de login */
    router.get('/login', enableCors, function(req, res) {
        if (req.isAuthenticated() && req.headers.referer) {
            var parsed = new URL(req.headers.referer);
            Domain.findOne({ '_id': parsed.hostname }, function(err, found) {
                if (found) {
                    Fanpage.findOne({ '_id': found.ref }, function(err, found) {
                        if (found) {
                            for (var i = 0; i < req.user.fanpages.length; i++) {
                                if (req.user.fanpages[i].id == found._id) {
                                    res.send({ auth: true, uid: req.user._id, name: req.user.facebook.name, email: req.user.facebook.email, isowner: true, csrf: res.locals._csrf });
                                    return;
                                }
                            }
                            
                            /* não é o dono quem está acessando */
                            res.send({ auth: true, uid: req.user._id, name: req.user.facebook.name, email: req.user.facebook.email, isowner: false });
                        } else {
                            res.send({ auth: true, uid: req.user._id, name: req.user.facebook.name, email: req.user.facebook.email, isowner: false });
                        }
                    });
                } else {
                    res.send({ auth: true, uid: req.user._id, name: req.user.facebook.name, email: req.user.facebook.email, isowner: false });
                }
            });
        } else {
            res.status(401).send({ auth: false });
        }
    });
    
    /* [retro ok] api para consulta do feed */
    router.get('/feeds/:before?', enableCors, function(req, res) {
        var filter = { ref: req.fanpage._id };

        if (req.params.before) {
            filter.time = { $lte: moment.unix(req.params.before).format() };
        }

        Feed.find(filter).limit(5).sort('-time').exec(function(err, found) {
            for (var i = 0; i < found.length; i++) {
                found[i].unix = moment(found[i].time).unix();
                found[i].fromNow = moment(found[i].time).fromNow();
                found[i].timelineInverted = ((i % 2) == 0 ? '' : 'timeline-inverted');
                found[i].isVideo = (found[i].type == 'video');
                found[i].videoLink = null;
                found[i].imageLink = null;
                
                if (found[i].isVideo) {
                    var link = found[i].link;
                    
                    var regfb = /facebook.com\/[0-9]+\/videos\/([0-9]+)\/?/;
                    var testfb = regfb.exec(link);

                    if (testfb && testfb.length == 2) {
                        link = 'https://www.facebook.com/video.php?v=' + testfb[1];
                    }
                    
                    link = link.replace('m.youtube.com/watch?v=', 'youtube.com/embed/');
                    link = link.replace('youtube.com/watch?v=', 'youtube.com/embed/');
                    link = link.replace('facebook.com/video.php?v=', 'facebook.com/video/embed?video_id=');
                    found[i].videoLink = link;
                } else {
                    if (found[i].cdn) {
                        found[i].imageLink = found[i].cdn;
                    } else if (found[i].source) {
                        found[i].imageLink = found[i].source;
                    } else {
                        found[i].imageLink = found[i].picture;
                    }
                }
                
                found[i].textName = (found[i].name ? found[i].name : null);
                found[i].textMessage = (found[i].message ? found[i].message : found[i].description);
                found[i].hasHeader = (found[i].videoLink != null || found[i].imageLink != null);
                found[i].hasBody = (found[i].textName != null || found[i].textMessage);
                
                if (found[i].textMessage) {
                    found[i].textMessage = found[i].textMessage.replace('\n', '<br/>');
                }
            }
            res.render('api-feeds', { feeds: found });
        });
    });
    
    /* [retro ok] api para consulta das fotos */
    router.get('/fotos/:before?', enableCors, function(req, res) {
        var filter = { ref: req.fanpage._id };

        if (req.params.before) {
            filter.time = { $lte: moment.unix(req.params.before).format() };
        }

        Album.find({ ref: req.fanpage._id, special: { '$in': [null, 'default'] } }, function(err, list) {
            var albums = [];

            if (list) {
                for (var i = 0; i < list.length; i++) {
                    albums.push(list[i]._id);
                }
            }

            filter.album_id = { '$in': albums };

            Photo.find(filter).limit(15).sort('-time').exec(function(err, found) {
                res.status(200).send({ fotos: found });
            });
        });
    });
    
    /* [retro ok] */
    router.get('/fotos-:album/:before?', enableCors, function(req, res) {
        var filter = { ref: req.fanpage._id };

        if (req.params.before) {
            filter.time = { $lte: moment.unix(req.params.before).format() };
        }

        Album.findOne({ ref: req.fanpage._id, path: req.params.album }, function(err, one) {
            if (one) {
                filter.album_id = one._id;
                Photo.find(filter).limit(15).sort('-time').exec(function(err, found) {
                    res.send({ fotos: found });
                });
            }
        });
    });
    
    /* [retro ok] api para consulta dos vídeos */
    router.get('/videos/:before?', enableCors, function(req, res) {
        var filter = { ref: req.fanpage._id };

        if (req.params.before) {
            filter.time = { $lte: moment.unix(req.params.before).format() };
        }

        Video.find(filter).limit(15).sort('-time').exec(function(err, found) {
            res.send({ videos: found });
        });
    });
    
    /* [should be retro ok] atualizações em tempo real do Facebook */
    router.get('/facebook/realtime', function(req, res) {
        console.log('Realtime updates verification request received.');
        if (req.query['hub.mode'] === 'subscribe') {
            if (req.query['hub.verify_token'] === '123456') {
                console.log('Challenge answered.');
                res.send(req.query['hub.challenge']);
                return;
            }
        }
        res.status(500).send();
    });
    
    /* [should be retro ok] */
    router.post('/facebook/realtime', function(req, res) {
        var update = new Update();
        update.time = Date.now();
        update.data = req.body;
        update.save(function(err, data) {
            if (err)
                throw err;
            
            RTU.syncPending();
        });
        res.status(200).send();
    });
    
    router.get('/pagseguro/callback', function(req, res) {
        var visitor = ua('UA-52753958-4');
        visitor.event('billing', 'finish-payment', '', 999.90).send();
        res.redirect('/account/login');
    });
    
    /* OLD API END */

};
