'use strict';

module.exports = function() {
    return function(req, res, next) {
        var locale = req.cookies && req.cookies.locale;
        res.locals.context = {
            locality: locale
        };
        next();
    }
}