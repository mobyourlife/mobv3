/*jslint node: true */
'use strict';

/* system libs */
var moment = require('moment');

/* app libs */
var queue = require('../lib/queue');
var helpers = require('../lib/helpers')();

/* database models */
var Fanpage = require('../models/fanpage');

/* constantes */
var timeout = 1;
var lastRun = 0;
var nextRun = moment().unix();

/* job tasks */

/* add page info to the queue */
var syncProfilePicture = function(page) {
    var url = page._id + '/picture?width=320&height=320';
    queue.add(page, url, null, syncProfilePictureCallback, [ 'url' ]);
}

/* parse page info callback response */
var syncProfilePictureCallback = function(page, row) {
    Fanpage.update({ _id: row.id }, {
        /* profile picture */
        'facebook.picture': helpers.safeImage(row.url),
        
        /* job status */
        'jobs.update_profile_picture': Date.now()
    }, function(err) {
        if (err) {
            throw 'Error updating output from sync profile picture: ' + err;
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
        syncProfilePicture(cur);
    }
};

/* job interface */
var job = {
    
    /* job name */
    jobName: 'Update profile picture',
    
    /* expose timeout */
    nextRun: function () {
        return nextRun;
    },
    
    /* check if job must be run */
    checkConditions: function (callback) {
        if (!callback) {
            throw 'No callback has been supplied for "checkConditions"!';
        }

        Fanpage.find({ $and: [ { 'billing.expiration': { $gt: new Date() } }, { 'jobs.new_site_created': { $exists: true, $ne: null }, $or: [ { 'jobs.update_profile_picture': { $exists: false } }, { 'jobs.update_profile_picture': { $lt: new Date((new Date()) - (1000 * 60 * 10)) } } ] } ] }, function (err, records) {
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