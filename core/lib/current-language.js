'use strict';

var getCountryCode = function(language) {
    switch(language) {
            case 'en-UK':
                return 'en';
            
            case 'pt-BR':
            default:
                return 'pt';
    }
}

var getCountryFlag = function(language) {
    switch(language) {
        case 'en-UK':
            return 'gb';

        case 'pt-BR':
        default:
            return 'br';
    }
}

module.exports = function(req) {
    return {
        language: req.cookies.locale,
        country: getCountryCode(req.cookies.locale),
        flag: getCountryFlag(req.cookies.locale)
    };
};