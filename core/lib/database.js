'use strict';
var mongoose = require('mongoose');

var db = function () {
    return {
        config: function (conf) {
            var defaultdb = 'mongodb://localhost:27017/MobYourLife';
            mongoose.connect(process.env.MONGOLAB_CONNECTION || defaultdb);
            var db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', function callback() {
                console.log('db connection open');
            });
        }
    };
};

module.exports = db();