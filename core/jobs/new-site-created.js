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
    queue.add(page._id, syncPageInfoCallback);
}

/* parse page info callback response */
var syncPageInfoCallback = function(row) {
    Fanpage.update({ _id: row.id }, {
        'init_done': true,
        'cover.path': row.cover.source,
        'facebook.about': row.about,
        'facebook.link': row.link,
        'facebook.name': row.name,
        'facebook.stats.link': row.likes
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
module.exports = {
    
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

        Fanpage.find({ init_done: { $ne: true } }, function (err, records) {
            if (err) {
                console.log('Database error: ' + err);
            } else {
                var status = (records && records.length !== 0);
                callback(status, records);
            }
        });
    },
    
    /* trigger job's work */
    doWork: function (records, callback) {
        nextRun = moment().unix() + timeout;
        startSyncing(records, callback);
    }
    
};