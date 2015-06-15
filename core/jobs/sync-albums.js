/*jslint node: true */
'use strict';

/* system libs */
var moment = require('moment');

/* app libs */
var queue = require('../lib/queue');
var helpers = require('../lib/helpers')();

/* database models */
var Fanpage = require('../models/fanpage');
var Album = require('../models/album');

/* constantes */
var timeout = 1;
var lastRun = 0;
var nextRun = moment().unix();

/* job tasks */

/* add page info to the queue */
var syncPageAlbums = function(page, args) {
    var url = page._id + '/albums';
    
    if (args) {
        args += '&';
    } else {
        args = '';
    }
    
    args += 'limit=25';
    
    queue.add(page, url, args, syncPageAlbumsCallback, [ 'id', 'name', 'type', 'count', 'updated_time' ], syncPageErrorCallback);
}

/* parse page info callback response */
var syncPageAlbumsCallback = function(page, result) {
    var i, item;
    
    if (result.data && result.data.length != 0) {
        /* update sync feeds execution time */
        Fanpage.update({ _id: page._id }, {
            'jobs.sync_albums': Date.now()
        }, function(err) {
            if (err) {
                throw 'Error updating output from sync page info: ' + err;
            }
        });
        
        /* processes all received feeds */
        for (i = 0; i < result.data.length; i++) {
            item = result.data[i];
            
            /* insert field to database */
            Album.update({ _id: item.id }, {
                ref: page,
                name: item.name,
                type: item.type,
                count: item.count ? item.count : null,
                path: helpers.formatAsPath(item.name) + '-' + item.id,
                time: item.updated_time
            }, { upsert: true }, function(err) {
                if (err) {
                    console.log('Error updating album ' + item.id + ':');
                    console.log(err);
                    throw 'Error updating album!';
                }
            });
        }
        
        /* queue next page */
        if (result.paging && result.paging.next && result.paging.cursors && result.paging.cursors.after) {
            syncPageAlbums(page, 'after=' + result.paging.cursors.after);
        }
    }
};

/* parse error conditions */
var syncPageErrorCallback = function(page, relative_url, error) {
    var info = {
        time: Date.now(),
        request: relative_url,
        error: JSON.stringify(error)
    };
    
    Fanpage.update({ _id: page._id }, { error: info }, function(err) {
        if (err) {
            console.log('---------- ERROR: Failed to log error info! ----------------');
            console.log(info);
            console.log('-------');
        }
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
        syncPageAlbums(cur);
    }
};

/* job interface */
var job = {
    
    /* job name */
    jobName: 'Sync albums',
    
    /* expose timeout */
    nextRun: function () {
        return nextRun;
    },
    
    /* check if job must be run */
    checkConditions: function (callback) {
        if (!callback) {
            throw 'No callback has been supplied for "checkConditions"!';
        }

        Fanpage.find({ $and: [ { 'billing.expiration': { $gt: new Date() } }, { 'jobs.new_site_created': { $exists: true, $ne: null }, $or: [ { 'jobs.sync_albums': { $exists: false } }, { 'jobs.sync_albums': { $lt: new Date((new Date()) - (1000 * 60 * 10)) } } ] } ] }, function (err, records) {
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