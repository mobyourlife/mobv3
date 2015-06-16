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
var syncPageInfo = function(page) {
    var url = page._id;
    queue.add(page, url, null, syncPageInfoCallback, [ 'id', 'name', 'about', 'cover', 'description', 'picture', 'category', 'category_list', 'is_verified', 'link', 'website', 'emails', 'checkins', 'likes', 'talking_about_count', 'were_here_count', 'phone', 'location', 'parking', 'general_info', 'hours', 'band_members', 'booking_agent', 'press_contact', 'hometown', 'company_overview', 'founded', 'mission', 'directed_by', 'attire', 'general_manager', 'price_range', 'restaurant_services', 'restaurant_specialties', 'birthday', 'payment_options' ], syncPageErrorCallback);
}

/* parse page info callback response */
var syncPageInfoCallback = function(page, row) {
    Fanpage.update({ _id: row.id }, {
        /* basic info */
        'facebook.about': helpers.formatLineBreaks(row.about),
        'facebook.category': row.category,
        'facebook.category_list': row.category_list,
        'facebook.description': helpers.formatLineBreaks(row.description),
        'facebook.emails': row.emails,
        'facebook.is_verified': row.is_verified,
        'facebook.link': row.link,
        'facebook.name': row.name,
        'facebook.picture': (row.picture && row.picture.data ? row.picture.data.url : null),
        'facebook.website': row.website,
        
        /* bands */
        'facebook.info.band.band_members': row.band_members,
        'facebook.info.band.booking_agent': row.booking_agent,
        'facebook.info.band.press_contact': row.press_contact,
        'facebook.info.band.hometown': row.hometown,
        
        /* company */
        'facebook.info.company.company_overview': (row.company_overview ? helpers.formatLineBreaks(row.company_overview) : null),
        'facebook.info.company.founded': row.founded,
        'facebook.info.company.mission': (row.mission ? helpers.formatLineBreaks(row.mission) : null),
        
        /* extra info */
        'facebook.info.general_info': row.general_info,
        'facebook.info.hours': row.hours,
        'facebook.info.impressum': row.impressum,
        
        /* films */
        'facebook.info.film.directed_by': row.directed_by,
        
        /* location */
        'facebook.place.location.street': (row.location ? row.location.street : null),
        'facebook.place.location.city': (row.location ? row.location.city : null),
        'facebook.place.location.state': (row.location ? row.location.state : null),
        'facebook.place.location.country': (row.location ? row.location.country : null),
        'facebook.place.location.zip': (row.location ? row.location.zip : null),
        'facebook.place.location.coordinates': (row.location && row.location.latitude && row.location.longitude ? [ parseFloat(row.location.latitude), parseFloat(row.location.longitude) ] : null),
        
        /* parking */
        'facebook.place.parking.lot': (row.parking ? row.parking.lot : null),
        'facebook.place.parking.street': (row.parking ? row.parking.street : null),
        'facebook.place.parking.valet': (row.parking ? row.parking.valet : null),
        
        /* payment options */
        'facebook.info.payment_options.amex': (row.payment_options ? row.payment_options.amex : null),
        'facebook.info.payment_options.cash_only': (row.payment_options ? row.payment_options.cash_only : null),
        'facebook.info.payment_options.discover': (row.payment_options ? row.payment_options.discover : null),
        'facebook.info.payment_options.mastercard': (row.payment_options ? row.payment_options.mastercard : null),
        'facebook.info.payment_options.visa': (row.payment_options ? row.payment_options.visa : null),
        
        /* personality */
        'facebook.info.personality.birthday': row.birthday,
        
        /* place */
        'facebook.place.phone': row.phone,
        
        /* restaurants and night life */
        'facebook.info.foodnight.attire': row.attire,
        'facebook.info.foodnight.general_manager': row.general_manager,
        'facebook.info.foodnight.price_range': row.price_range,
        
        /* restaurants services */
        'facebook.info.foodnight.restaurant.services.kids': (row.restaurant_services ? row.restaurant_services.kids : null),
        'facebook.info.foodnight.restaurant.services.delivery': (row.restaurant_services ? row.restaurant_services.delivery : null),
        'facebook.info.foodnight.restaurant.services.walkins': (row.restaurant_services ? row.restaurant_services.walkins : null),
        'facebook.info.foodnight.restaurant.services.catering': (row.restaurant_services ? row.restaurant_services.catering : null),
        'facebook.info.foodnight.restaurant.services.reserve': (row.restaurant_services ? row.restaurant_services.reserve : null),
        'facebook.info.foodnight.restaurant.services.groups': (row.restaurant_services ? row.restaurant_services.groups : null),
        'facebook.info.foodnight.restaurant.services.waiter': (row.restaurant_services ? row.restaurant_services.waiter : null),
        'facebook.info.foodnight.restaurant.services.outdoor': (row.restaurant_services ? row.restaurant_services.outdoor : null),
        'facebook.info.foodnight.restaurant.services.takeout': (row.restaurant_services ? row.restaurant_services.takeout : null),

        /* restaurants specialties */
        'facebook.info.foodnight.restaurant.specialties.coffee': (row.restaurant_specialties ? row.restaurant_specialties.coffee : null),
        'facebook.info.foodnight.restaurant.specialties.drinks': (row.restaurant_specialties ? row.restaurant_specialties.drinks : null),
        'facebook.info.foodnight.restaurant.specialties.breakfast': (row.restaurant_specialties ? row.restaurant_specialties.breakfast : null),
        'facebook.info.foodnight.restaurant.specialties.dinner': (row.restaurant_specialties ? row.restaurant_specialties.dinner : null),
        'facebook.info.foodnight.restaurant.specialties.lunch': (row.restaurant_specialties ? row.restaurant_specialties.lunch : null),
        
        /* stats */
        'facebook.stats.checkins': row.checkins,
        'facebook.stats.likes': row.likes,
        'facebook.stats.talking_about_count': row.talking_about_count,
        'facebook.stats.were_here_count': row.were_here_count,
        
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

        Fanpage.find({
            $and: [
                { 'billing.expiration': { $gt: new Date() } },
                { 'jobs.new_site_created': { $exists: true, $ne: null },
                   $or: [
                     { 'jobs.update_page_info': { $exists: false } },
                     { 'jobs.update_page_info': { $lt: new Date((new Date()) - (1000 * 60 * 10)) } }
                   ]
                },
                { $or: [
                        { 'error': { $exists: false } },
                        { 'error.time': { $lt: new Date((new Date()) - (1000 * 60 * 30)) } }
                    ]
                }
            ]
        }, function (err, records) {
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