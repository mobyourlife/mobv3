/*jslint node: true */
'use strict';

/* system libs */
var moment = require('moment');

/* app libs */
var queue = require('../lib/queue');
var helpers = require('../lib/helpers')();

/* database models */
var Fanpage = require('../models/fanpage');
var Video = require('../models/video');

/* constantes */
var timeout = 1;
var lastRun = 0;
var nextRun = moment().unix();

/* job tasks */

/* add page info to the queue */
var syncPageVideos = function(page, args) {
    var url = page._id + '/videos';
    var und = page._id + '/posts';
    
    if (args) {
        args += '&';
    } else {
        args = '';
    }
    
    args += 'type=video&limit=25';
    
    queue.add(page, url, args, syncPageVideosCallback, [ 'id', 'updated_time', 'description', 'name' ]);
    queue.add(page, und, args, syncPageVideosCallback, [ 'id', 'updated_time', 'message', 'name', 'link' ]);
}

/* parse page info callback response */
var syncPageVideosCallback = function(page, result) {
    var i, item;
    
    if (result.data && result.data.length != 0) {
        /* update sync feeds execution time */
        Fanpage.update({ _id: page._id }, {
            'jobs.sync_videos': Date.now()
        }, function(err) {
            if (err) {
                throw 'Error updating output from sync page info: ' + err;
            }
        });
        
        /* processes all received feeds */
        for (i = 0; i < result.data.length; i++) {
            item = result.data[i];
            
            /* check if it isn't a post or it's a video post */
            if (!item.type || item.type === 'video') {
                /* insert field to database */
                Video.update({ _id: item.id }, {
                    ref: page,
                    time: item.updated_time,
                    name: item.name,
                    description: (item.description ? item.description : (item.message ? item.message : null)),
                    link: (item.link ? item.link : 'https://www.facebook.com/video.php?v=' + item.id)
                }, { upsert: true }, function(err) {
                    if (err) {
                        throw 'Error updating video: ' + err;
                    }
                });
            }
        }
        
        /* queue next page */
        if (result.paging && result.paging.next && result.paging.cursors && result.paging.cursors.after) {
            syncPageVideos(page, 'after=' + result.paging.cursors.after);
        }
    }
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
        syncPageVideos(cur);
    }
};

/* job interface */
var job = {
    
    /* job name */
    jobName: 'Sync videos',
    
    /* expose timeout */
    nextRun: function () {
        return nextRun;
    },
    
    /* check if job must be run */
    checkConditions: function (callback) {
        if (!callback) {
            throw 'No callback has been supplied for "checkConditions"!';
        }

        Fanpage.find({ 'jobs.new_site_created': { $exists: true, $ne: null }, $or: [ { 'jobs.sync_feeds': { $exists: false } }, { 'jobs.sync_feeds': { $lt: new Date((new Date()) - (1000 * 60 * 10)) } } ] }, function (err, records) {
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