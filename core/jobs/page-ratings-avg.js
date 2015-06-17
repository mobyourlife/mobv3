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
var calcAvgPageRatings = function(pages) {
    var page_list = [];
    for (var i = 0; i < pages.length; i++) {
        page_list.push(pages[i]._id);
    }
    
    Fanpage.aggregate(
        { $match: { _id: { $in: page_list } } },
        { $unwind: '$ratings' },
        { $group: {
            '_id': '$_id',
            'avg_rating': { $avg: '$ratings.rating' }
        }}
    ).exec(function(err, results) {
        if (err) {
            throw err;
        }
        
        calcAvgPageRatingsCallback(results);
    });
}

/* parse page info callback response */
var calcAvgPageRatingsCallback = function(results) {
    for (var i = 0; i < results.length; i++) {
        var cur = results[i];
        Fanpage.update({ _id: cur._id }, {
            /* page ratings average */
            ratings_average: cur.avg_rating,
            
            /* job status */
            'jobs.page_ratings_avg': Date.now()
        }, function(err) {
            if (err) {
                throw err;
            }
        });
    }
};

/* start syncing page contents */
var startSyncing = function (records, callback) {
    var i,
        cur;
    
    if (!callback) {
        throw 'No callback has been supplied for "startSyncing"';
    }
    
    calcAvgPageRatings(records);
};

/* job interface */
var job = {
    
    /* job name */
    jobName: 'Ratings averages',
    
    /* expose timeout */
    nextRun: function () {
        return nextRun;
    },
    
    /* check if job must be run */
    checkConditions: function (callback) {
        if (!callback) {
            throw 'No callback has been supplied for "checkConditions"!';
        }

        Fanpage.find({ $and: [ { 'billing.expiration': { $gt: new Date() } }, { 'error': { $exists: false } }, { 'ratings': { $exists: true } }, { 'jobs.page_ratings': { $exists: true, $ne: null }, $or: [ { 'jobs.page_ratings_avg': { $exists: false } }, { 'jobs.page_ratings_avg': { $lt: new Date((new Date()) - (1000 * 60 * 10)) } } ] } ] }, function (err, records) {
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