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
var syncPageFeeds = function(page, args) {
    var url = page._id + '/feed';
    
    if (args) {
        url += '?' + args;
    }
    
    queue.add(page, url, syncPageFeedsCallback, [ 'id', 'story', 'picture', 'link', 'updated_time', 'type', 'name', 'caption', 'description', 'message', 'object_id', 'source', 'actions', 'shares', 'likes' ]);
}

/* parse page info callback response */
var syncPageFeedsCallback = function(page, result) {
    var i, item;
    
    if (result.data && result.data.length != 0) {
        /* processes all received feeds */
        for (i = 0; i < result.data.length; i++) {
            item = result.data[i];
            
            /* insert field to database */
            Feed.update({ _id: item.id }, {
                ref: page,
                time: item.updated_time,
                story: item.story,
                source: item.source,
                shares_count: (item.shares ? item.shares.count : 0),
                likes_count: (item.likes && item.likes.data ? item.likes.data.length : 0),
                link: (item.type === 'status' && item.actions ? item.actions[0].link : item.link),
                type: item.type,
                name: item.name,
                caption: item.caption,
                description: item.description,
                message: item.message,
                object_id: item.object_id,
            }, { upsert: true }, function(err) {
                if (err) {
                    throw 'Error updating feed: ' + err;
                }
            });
        }
        
        /* queue next page */
        if (result.paging && result.paging.next) {
            //syncPageFeeds(page, 'limit=25&until=');
        }
    }
    
    /*Fanpage.update({ _id: row.id }, {
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
    });*/
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
        syncPageFeeds(cur);
    }
};

/* job interface */
var job = {
    
    /* job name */
    jobName: 'Sync feeds',
    
    /* expose timeout */
    nextRun: function () {
        return nextRun;
    },
    
    /* check if job must be run */
    checkConditions: function (callback) {
        if (!callback) {
            throw 'No callback has been supplied for "checkConditions"!';
        }

        Fanpage.find({ 'jobs.sync_feeds': { $exists: false } }, function (err, records) {
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