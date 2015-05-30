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
    queue.add(page._id, syncPageInfoCallback, [ 'id', 'name', 'about', 'cover', 'description', 'picture', 'category', 'category_list', 'is_verified', 'link', 'website', 'emails', 'checkins', 'likes', 'talking_about_count', 'were_here_count', 'phone', 'location', 'parking', 'general_info', 'hours', 'band_members', 'booking_agent', 'press_contact', 'hometown', 'company_overview', 'founded', 'mission', 'directed_by', 'attire', 'general_manager', 'price_range', 'restaurant_services', 'restaurant_specialties', 'birthday', 'payment_options' ]);
}

/* parse page info callback response */
var syncPageInfoCallback = function(row) {
    Fanpage.update({ _id: row.id }, {
        'cover.path': (row.cover ? row.cover.source : null),
        'facebook.about': row.about,
        'facebook.category': row.category,
        'facebook.category_list': row.category_list,
        'facebook.emails': row.emails,
        'facebook.is_verified': row.is_verified,
        'facebook.link': row.link,
        'facebook.name': row.name,
        'facebook.picture': (row.picture && row.picture.data ? row.picture.data.url : null),
        'facebook.website': row.website,
        
        /* stats */
        'facebook.stats.checkins': row.checkins,
        'facebook.stats.likes': row.likes,
        'facebook.stats.talking_about_count': row.talking_about_count,
        'facebook.stats.were_here_count': row.were_here_count,
        
        /* place */
        'facebook.place.phone': row.phone,
        
        /* job status */
        'jobs.update_page_info': Date.now()
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
    jobName: 'Update page info',
    
    /* expose timeout */
    nextRun: function () {
        return nextRun;
    },
    
    /* check if job must be run */
    checkConditions: function (callback) {
        if (!callback) {
            throw 'No callback has been supplied for "checkConditions"!';
        }

        Fanpage.find({ 'jobs.new_site_created': { $exists: true, $ne: null }, 'jobs.update_page_info': { $exists: false } }, function (err, records) {
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