/*jslint node: true */
'use strict';

/* system libs */
var moment = require('moment');

/* app libs */
var queue = require('../lib/queue');
var helpers = require('../lib/helpers')();

/* database models */
var Fanpage = require('../models/fanpage');
var User = require('../models/user');

/* constantes */
var timeout = 1;
var lastRun = 0;
var nextRun = moment().unix();

/* job tasks */

/* add page info to the queue */
var syncPageRatings = function(page, args) {
    var url = page.id + '/ratings';
    
    if (args) {
        args += '&';
    } else {
        args = '';
    }
    
    args += 'limit=25';
    args += '&access_token=' + page.access_token;
    
    queue.add(page, url, args, syncPageRatingsCallback, [ 'reviewer{id}', 'rating' ]);
}

/* parse page info callback response */
var syncPageRatingsCallback = function(page, ratings) {
    
    if (ratings.data) {
        for (var i = 0; i < ratings.data.length; i++) {
            var cur = ratings.data[i];
            
            Fanpage.update({ _id: page.id }, {
                /* page ratings */
                $addToSet: { ratings: { reviewer: cur.reviewer.id, rating: cur.rating } },

                /* job status */
                'jobs.page_ratings': Date.now()
            }, function(err) {
                if (err) {
                    throw 'Error updating output from sync page ratings: ' + err;
                }
            });
        }
    }
        
    /* queue next page */
    if (ratings.paging && ratings.paging.next && ratings.paging.cursors && ratings.paging.cursors.after) {
        syncPageRatings(page, 'after=' + ratings.paging.cursors.after);
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
        
        User.findOne({ 'fanpages.id': cur._id }, { fanpages: { $elemMatch: { id: cur._id } } }, function (err, owner) {
            if (err) {
                throw err;
            }
            
            if (owner.fanpages.length === 1 && owner.fanpages[0].access_token) {
                syncPageRatings(owner.fanpages[0]);
            }
        });
    }
};

/* job interface */
var job = {
    
    /* job name */
    jobName: 'Page ratings',
    
    /* expose timeout */
    nextRun: function () {
        return nextRun;
    },
    
    /* check if job must be run */
    checkConditions: function (callback) {
        if (!callback) {
            throw 'No callback has been supplied for "checkConditions"!';
        }

        Fanpage.find({ $and: [ { 'billing.expiration': { $gt: new Date() } }, { 'error': { $exists: false } }, { 'jobs.new_site_created': { $exists: true, $ne: null }, $or: [ { 'jobs.update_profile_picture': { $exists: false } }, { 'jobs.update_profile_picture': { $lt: new Date((new Date()) - (1000 * 60 * 10)) } } ] } ] }, function (err, records) {
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