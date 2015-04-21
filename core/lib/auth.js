'use strict';

module.exports = function (router, passport) {

    router.get('/account/login', function (req, res) {
        res.redirect('/account/auth/facebook');
    });
    
    router.get('/account/login/callback', function (req, res) {
        res.redirect('/admin/');
    });
    
    router.get('/account/auth/facebook', passport.authenticate('facebook', {
        scope: 'email,manage_pages'
    }));
    
    router.get('/account/auth/facebook/callback', passport.authenticate('facebook', {
       successRedirect: '/account/login/callback',
       failureRedirect: '/'
    }));
    
    router.get('/account/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });
    
    
    /******************************************************
    
    app.get('/login', function(req, res) {
        validateSubdomain(req.headers.referer ? req.headers.referer : req.headers.host, res, function(menu) {
            res.redirect('/auth/facebook');
        }, function(userFanpage, menu) {
            req.session.backto = req.headers.referer;
            res.redirect('/auth/facebook');
        });
    });
    
    app.get('/login/callback', function(req, res) {
        if (req.session.backto && req.session.backto != null) {
            var goto = req.session.backto;
            req.session.backto = null;
            res.redirect(goto);
        } else {
            res.redirect('/meus-sites');
        }
    });
    
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope : 'email,manage_pages'
    }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect : '/login/callback',
        failureRedirect : '/'
    }));
    
    *********************************************************/

};
