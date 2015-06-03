/*jslint node: true */
'use strict';

/* system libs */
var moment = require('moment');

/* app libs */
var queue = require('../lib/queue');

/* database models */
var Fanpage = require('../models/fanpage');

/* constantes */
var timeout = 1;
var lastRun = 0;
var nextRun = moment().unix();

/* job tasks */

/* add page info to the queue */
var syncPageInfo = function(page) {
    var url = page._id;
    queue.add(page, url, null, syncPageInfoCallback, [ 'about', 'cover{source}', 'likes', 'link', 'name', 'picture{url}' ]);
}

/* parse page info callback response */
var syncPageInfoCallback = function(page, row) {
    Fanpage.update({ _id: row.id }, {
        'cover.path': (row.cover ? row.cover.source : null),
        'facebook.about': row.about,
        'facebook.link': row.link,
        'facebook.name': row.name,
        'facebook.picture': (row.picture && row.picture.data ? row.picture.data.url : null),
        'facebook.stats.link': row.likes,
        'jobs.new_site_created': Date.now()
    }, function(err) {
        if (err) {
            throw 'Error updating output from sync page info: ' + err;
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
        syncPageInfo(cur);
    }
};

/* job interface */
var job = {
    
    /* job name */
    jobName: 'New site created',
    
    /* expose timeout */
    nextRun: function () {
        return nextRun;
    },
    
    /* check if job must be run */
    checkConditions: function (callback) {
        if (!callback) {
            throw 'No callback has been supplied for "checkConditions"!';
        }

        Fanpage.find({ 'jobs.new_site_created': { $exists: false } }, function (err, records) {
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