'use strict';

var getCountryFlag = function(language) {
    switch(language) {
        case 'pt-BR':
            return 'br';

        case 'en-UK':
        default:
            return 'gb';
    }
}

module.exports = function(req) {
    return {
        language: req.cookies.locale,
        country: getCountryFlag(req.cookies.locale)
    };
};