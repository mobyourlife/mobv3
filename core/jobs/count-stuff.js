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
var syncCount = function(pageid) {
    Feed.find({ ref: pageid, type: 'video' }, function (err, records) {
        var count = records.length;
        Fanpage.update({ _id: pageid }, { video_count: count, 'jobs.count_stuff': Date.now() }, function(err) {
            if (err) {
                throw err;
            }
        });
    });
}

/* start syncing page contents */
var startSyncing = function (records, callback) {
    var i,
        cur;
    
    if (!callback) {
        throw 'No callback has been supplied for "startSyncing"';
    }
    
    for (i = 0; i < records.length; i += 1) {
        cur = records[i];
        syncCount(cur);
    }
};

/* job interface */
var job = {
    
    /* job name */
    jobName: 'Count stuff',
    
    /* expose timeout */
    nextRun: function () {
        return nextRun;
    },
    
    /* check if job must be run */
    checkConditions: function (callback) {
        if (!callback) {
            throw 'No callback has been supplied for "checkConditions"!';
        }

        Fanpage.find({ 'billing.expiration': { $gt: new Date() }, 'jobs.new_site_created': { $exists: true, $ne: null }, $or: [ { 'jobs.count_stuff': { $exists: false } }, { 'jobs.count_stuff': { $lt: new Date((new Date()) - (1000 * 60 * 10)) } } ] }, function (err, pages) {
            var pages_list = [];
            for (var i = 0; i < pages.length; i++) {
                pages_list.push(pages[i]._id);
            }
            
            var status = (pages_list && pages_list.length !== 0);
            callback(job, status, pages_list);
        });
    },
    
    /* trigger job's work */
    doWork: function (records, callback) {
        nextRun = moment().unix() + timeout;
        startSyncing(records, callback);
    }
    
};

module.exports = job;