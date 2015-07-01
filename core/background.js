/*jslint node: true */
'use strict';

/* debug */
var mongoose = require('mongoose');
mongoose.connect('mongodb://54.94.142.253:27017/MobYourLife');

/* system libs */
var moment = require('moment');

/* app libs */
var queue = require('./lib/queue');

/* load jobs */
var jobs = [];
jobs.push(require('./jobs/new-site-created'));
jobs.push(require('./jobs/update-page-info'));
jobs.push(require('./jobs/update-profile-picture'));
jobs.push(require('./jobs/sync-feeds'));
jobs.push(require('./jobs/feeds-pictures'));
jobs.push(require('./jobs/sync-albums'));
jobs.push(require('./jobs/sync-photos'));
jobs.push(require('./jobs/sync-videos'));
jobs.push(require('./jobs/count-stuff'));
//jobs.push(require('./jobs/welcome-email'));
//jobs.push(require('./jobs/page-ratings'));
//jobs.push(require('./jobs/page-ratings-avg'));

/* background loop */
var execute = function() {
    queue.execute();
};

var loop = function () {
    var now = moment().unix(),
        i,
        cur;
    
    for(i = 0; i < jobs.length; i += 1) {
        var cur = jobs[i];
        
        if (cur) {
            if (now >= cur.nextRun()) {
                console.log('Checking conditions for job "' + cur.jobName + '"...');
                cur.checkConditions(function (job, status, model) {
                    console.log(status ? '  [OK] Running job "' + job.jobName + '"...' : '  [NOPE] Job "' + job.jobName + '" will not run.');
                    job.doWork(model, function() {
                        console.log('  [DONE] Finished job "' + job.jobName + '.');
                    });
                });
            }
        }
    }
    
    setTimeout(execute, 30 * 1000);
    setTimeout(loop, 300 * 1000);
};

var start = function () {
    console.log('Starting Background Queue service...');
    queue.auth(function () {
        loop();
    });
};

module.exports = {
    start: start
};

start();
