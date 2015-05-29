/*jslint node: true */
'use strict';

/* debug */
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/MobYourLife');

/* system libs */
var moment = require('moment');

/* app libs */
var queue = require('./lib/queue');

/* load jobs */
var jobs = [];
jobs.push(require('./jobs/new-site-created'));
jobs.push(require('./jobs/update-page-info'));

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
                cur.checkConditions(function (status, model) {
                    console.log(status ? '  [OK] Running job...' : '  [NOPE] Job will not run.');
                    cur.doWork(model, function() {
                        console.log('  [DONE] Finished job "' + cur.jobName + '.');
                    });
                });
            }
        }
    }
    
    setTimeout(execute, 5000);
    setTimeout(loop, 10000);
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