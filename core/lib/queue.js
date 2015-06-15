/*jslint node: true */
'use strict';

/* system libs */
var FB = require('fb');

/* app libs */
var auth = require('../config/auth');

/* working variables */
var RequestsQueue = [];

/* queue process */
module.exports = {
    
    /* authorise application */
    auth: function (callback) {
        FB.api('oauth/access_token', {
            client_id: auth.facebook.clientID,
            client_secret: auth.facebook.clientSecret,
            grant_type: 'client_credentials'
        }, function (res) {
            if (!res || res.error) {
                console.log('Authorisation failed!');
                console.log(!res ? 'Unknown Facebook error!' : res.error);
            } else {
                console.log('Authorisation successful!');
                console.log('Access token: ' + res.access_token);
                FB.setAccessToken(res.access_token);
                callback();
            }
        });
    },
    
    /* add a new request to the queue */
    add: function (page, request, args, callback, fields, errorCallback) {
        var newRequest = {
            page: page,
            request: request,
            args: args,
            callback: callback,
            errorCallback: errorCallback,
            fields: fields
        };
        RequestsQueue.push(newRequest);
        console.log('  Added /' + request + ' to the queue.');
    },
    
    /* execute all requests which are pending */
    execute: function () {
        var i,
            j,
            cur,
            url,
            poll = [],
            obj;
        
        /* pop all the queue */
        while (RequestsQueue.length > 0 && poll.length < 50) {
            cur = RequestsQueue.pop();
            
            /* format the query string */
            url = cur.request + '?locale=pt_BR';
            
            if (cur.args) {
                url += '&' + cur.args;
            }
            
            for(j = 0; j < cur.fields.length; j += 1) {
                url += (j === 0) ? '&fields=' : ',';
                url += cur.fields[j];
            }
            
            /* add each job to the batch poll */
            poll.push({
                method: 'get',
                relative_url: url,
                page: cur.page,
                callback: cur.callback,
                errorCallback: cur.errorCallback
            });
            
            console.log('>> GET ' + url);
        }
        
        /* post the batch request */
        if (poll.length > 0) {
            FB.api('', 'post', { batch: poll }, function(res) {
                if (!res || res.error) {
                    console.log('-------- FATAL: BATCH FACEBOOK ERROR ----------');
                    console.log(poll);
                    console.log('-----');
                    console.log(res);
                    console.log('-----------------------------------------------');
                    throw res.error;
                }

                /* parse each response and exec the corresponding callback */
                for (j = 0; j < res.length; j += 1) {
                    obj = JSON.parse(res[j].body);
                    if (!obj || obj.error) {
                        if (poll[j].errorCallback) {
                            poll[j].errorCallback(poll[j].page, poll[j].relative_url, obj.error);
                        }
                        console.log('----------');
                        console.log('Error at request ' + poll[j].relative_url + ':');
                        console.log(obj.error);
                        console.log('----------');
                    } else {
                        poll[j].callback(poll[j].page, obj);
                    }
                }
            });
        }
    }
    
};