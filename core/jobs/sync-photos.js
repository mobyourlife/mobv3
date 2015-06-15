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
var Photo = require('../models/photo');

/* constantes */
var timeout = 1;
var lastRun = 0;
var nextRun = moment().unix();

/* job tasks */

/* add page info to the queue */
var syncAlbumPhotos = function(album, args) {
    var url = album._id + '/photos';
    
    if (args) {
        args += '&';
    } else {
        args = '';
    }
    
    args += 'limit=25';
    
    queue.add(album, url, args, syncAlbumPhotosCallback, [ 'id', 'source', 'updated_time', 'images', 'album', 'name' ]);
}

/* parse page info callback response */
var syncAlbumPhotosCallback = function(album, result) {
    var i, item;
    
    if (result.data && result.data.length != 0) {
        /* update sync feeds execution time */
        Album.update({ _id: album._id }, {
            latest_sync: Date.now()
        }, function(err) {
            if (err) {
                throw 'Error updating output from album info: ' + err;
            }
        });
        
        /* processes all received feeds */
        for (i = 0; i < result.data.length; i++) {
            item = result.data[i];
            
            /* insert field to database */
            Photo.update({ _id: item.id }, {
                ref: album.ref,
                source: item.source,
                time: item.updated_time,
                name: item.name,
                album_id: item.album.id,
                picture: (item.images && item.images.length != 0) ? helpers.safeImage(item.images[0].source) : null
            }, { upsert: true }, function(err) {
                if (err) {
                    throw 'Error updating photo: ' + err;
                }
            });
        }
        
        /* queue next page */
        if (result.paging && result.paging.next && result.paging.cursors && result.paging.cursors.after) {
            syncAlbumPhotos(album, 'after=' + result.paging.cursors.after);
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
        syncAlbumPhotos(cur);
    }
};

/* job interface */
var job = {
    
    /* job name */
    jobName: 'Sync photos',
    
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
            
            Album.find({ 'ref': { $in: pages_list }, 'count': { $gt: 0 }, $or: [ { 'latest_sync': { $exists: false } }, { 'latest_sync': { $lt: new Date((new Date()) - (1000 * 60 * 10)) } } ] }, function (err, records) {
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