'use strict';


module.exports = function (router) {

    router.get('/:locale/:noredir?', function (req, res) {
        
        res.cookie('locale', req.params.locale);
        
        if (req.params.noredir) {
            res.status(200).send();
        } else if (req.headers.referer) {
            res.redirect(req.headers.referer);
        } else {
            res.redirect('/');
        }
        
    });

};
