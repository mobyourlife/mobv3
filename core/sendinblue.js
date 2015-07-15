var mongoose = require('mongoose');
var Fanpage = require('./models/fanpage');

mongoose.connect('mongodb://54.94.142.253:27017/MobYourLife');

Fanpage.find({}, function (err, records) {
        records.forEach(function (i) {
                if (i.facebook.emails && i.facebook.emails.length > 0) {
                        console.log(i.facebook.emails[0]);
                }
        })
});