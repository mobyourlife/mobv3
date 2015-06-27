/*jslint node: true */
'use strict';

/* system libs */
var moment = require('moment');

/* app libs */
var email = require('../lib/email')();
var queue = require('../lib/queue');

/* database models */
var Fanpage = require('../models/fanpage');

/* constantes */
var timeout = 1;
var lastRun = 0;
var nextRun = moment().unix();

/* job tasks */

/* add page info to the queue */
var sendEmail = function(page) {
    console.log('Sending welcome email to fanpage ' + page._id + ' - ' + page.facebook.name + '.');
    email.montarEmail('d:/Repos/fmobstudio/mob/email/bem-vindo.html', page._id, function(html, user_email) {
        email.enviarEmail('Mob Your Life', 'nao-responder@mobyourlife.com.br', 'Bem-vindo ao Mob Your Life', html, user_email, function() {
            emailSentCallback(page);
        }, function(err) {
            throw err;
        });
    });
}

/* parse page info callback response */
var emailSentCallback = function(page) {
    Fanpage.update({ _id: page._id }, {
        'jobs.welcome_email': Date.now()
    }, function(err) {
        if (err) {
            throw 'Error updating output from mail sent: ' + err;
        }
    });
};

/* start syncing page contents */
var startSyncing = function (records, callback) {
    var i,
        cur;
    
    if (!callback) {
        throw 'No callback has been supplied for "startSyncing"';
    }
    
    for (i = 0; i < records.length; i += 1) {
        cur = records[i];
        sendEmail(cur);
    }
};

/* job interface */
var job = {
    
    /* job name */
    jobName: 'Welcome email',
    
    /* expose timeout */
    nextRun: function () {
        return nextRun;
    },
    
    /* check if job must be run */
    checkConditions: function (callback) {
        if (!callback) {
            throw 'No callback has been supplied for "checkConditions"!';
        }

        Fanpage.find({ 'jobs.welcome_email': { $exists: false } }, function (err, records) {
            if (err) {
                console.log('Database error: ' + err);
            } else {
                var status = (records && records.length !== 0);
                callback(job, status, records);
            }
        });
    },
    
    /* trigger job's work */
    doWork: function (records, callback) {
        nextRun = moment().unix() + timeout;
        startSyncing(records, callback);
    }
    
};

module.exports = job;
