'use strict';


module.exports = function (router) {

    router.get('/:partialview', function (req, res) {
        
        res.render('admin/partials/' + req.params.partialview);
        
    });
    
    router.get('/:foldername/:partialview', function (req, res) {
        
        res.render('admin/partials/' + req.params.foldername + '/' + req.params.partialview);
        
    });

};
