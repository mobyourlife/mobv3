'use strict';


module.exports = function (router) {

    router.get('/:locale', function (req, res) {
        
        res.cookie('locale', req.params.locale);
        
        if (req.headers.referer) {
            res.redirect(req.headers.referer);
        } else {
            res.redirect('/');
        }
        
    });

};
