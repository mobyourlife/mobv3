// app/models/email.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var emailSchema = mongoose.Schema({
    email: String,
    time: Date,
    validated: Date
});

// export ticket model
module.exports = mongoose.model('Email', emailSchema);