'use strict';

var express = require('express');
var kraken = require('kraken-js');
var passport = require('passport');
var Facebook = require('facebook-node-sdk');

var auth = require('./config/auth');
var config = require('./config/config');
var db = require('./lib/database');

db.config(config.database);

var options, app;

/*
 * Create and configure application. Also exports application instance for use by tests.
 * See https://github.com/krakenjs/kraken-js#options for additional configuration options.
 */
options = {
    onconfig: function (config, next) {
        /*
         * Add any additional config setup or overrides here. `config` is an initialized
         * `confit` (https://github.com/krakenjs/confit/) configuration object.
         */
        next(null, config);
    }
};

/* setup kraken */
app = module.exports = express();
app.use(kraken(options));

/* setup passport */
app.use(passport.initialize());
app.use(passport.session());
app.use(Facebook.middleware({ appID: auth.facebook.clientID, secret: auth.facebook.clientSecret }));
require('./lib/passport')(passport);
require('./lib/auth')(app, passport);

/* start express */
app.on('start', function () {
    console.log('Application ready to serve requests.');
    console.log('Environment: %s', app.kraken.get('env:env'));
});
