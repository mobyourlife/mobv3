'use strict';

var FB = require('fb');
var config = require('./config/config');

/* welcome message */
console.info('Starting Back Sync service...');

/* get facebook application access token */
FB.api('oauth/access_token', {
    client_id: config.facebook.clientID,
    client_secret: config.facebook.clientSecret,
    grant_type: 'client_credentials'
}, function(res) {
    if (!res || res.error) {
        console.error(!res ? 'Login failed!' : res.error);
        return;
    }
    
    /* set access token globally */
    FB.setAccessToken(res.access_token);
    console.info('Login successful!');
    
    /* initialise the request pool */
    var request_pool = Array();
    
    /* test batch requests */
    FB.api('', 'post', {
        batch: [
            { method: 'get', relative_url: '806923579327460?fields=name' },
            { method: 'get', relative_url: '1446731825581145?fields=name' },
            { method: 'get', relative_url: '1573492856239593?fields=name' }
        ]
    }, function(res) {
        if (!res || res.error) {
            console.error(!res ? 'Batch request failed!' : res.error);
            return;
        }
        
        for (var i = 0; i < res.length; i++) {
            console.log(res[i].body);
        }
    });
});