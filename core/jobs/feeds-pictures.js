/*jslint node: true */
'use strict';

/* system libs */
var moment = require('moment');

/* app libs */
var queue = require('../lib/queue');
var helpers = require('../lib/helpers')();

/* database models */
var Fanpage = require('../models/fanpage');
var Feed = require('../models/feed');

/* constantes */
var timeout = 1;
var lastRun = 0;
var nextRun = moment().unix();

/* job tasks */

/* add page info to the queue */
var syncFeedPicture = function(feed, args) {
    var url = feed.object_id;
    queue.add(feed, url, args, syncFeedPictureCallback, [ 'picture', 'source' ]);
}

/* parse page info callback response */
var syncFeedPictureCallback = function(feed, result) {
    var safe_picture = helpers.safeImage((result.images && result.images.length != 0 ? result.images[0].source : (result.source ? result.source : result.picture)));
    Feed.update({ _id: feed._id }, {
        picture: safe_picture,
        picture_synced: Date.now()
    }, function (err) {
        if (err) {
            throw err;
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
        syncFeedPicture(cur);
    }
};

/* job interface */
var job = {
    
    /* job name */
    jobName: 'Update feeds pictures',
    
    /* expose timeout */
    nextRun: function () {
        return nextRun;
    },
    
    /* check if job must be run */
    checkConditions: function (callback) {
        if (!callback) {
            throw 'No callback has been supplied for "checkConditions"!';
        }

        Fanpage.find({ 'billing.expiration': { $gt: new Date() }, 'jobs.new_site_created': { $exists: true, $ne: null } }, function (err, pages) {
            var pages_list = [];
            for (var i = 0; i < pages.length; i++) {
                pages_list.push(pages[i]._id);
            }
            
            Feed.find({ ref: { $in: pages_list }, type: 'photo', object_id: { $exists: true }, picture_synced: { $exists: false } }, function (err, records) {
                if (err) {
                    console.log('Database error: ' + err);
                } else {
                    var status = (records && records.length !== 0);
                    callback(job, status, records);
                }
            });
        });
    },
    
    /* trigger job's work */
    doWork: function (records, callback) {
        nextRun = moment().unix() + timeout;
        startSyncing(records, callback);
    }
    
};

module.exports = job;