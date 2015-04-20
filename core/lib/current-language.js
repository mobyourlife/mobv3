'use strict';

var getCountryCode = function(language) {
    switch(language) {
            case 'pt-BR':
                return 'pt';
            
            case 'en-UK':
            default:
                return 'en';
    }
}

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
        country: getCountryCode(req.cookies.locale),
        flag: getCountryFlag(req.cookies.locale)
    };
};