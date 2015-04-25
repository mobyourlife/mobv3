// app/models/domain.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var ticketSchema = mongoose.Schema({
    ref: { type: String, ref: 'Fanpage' },
    time: Date,
    status: String,
    validity: {
        months: Number,
        days: Number
    },
    payment: {
        value: Number,
        code: String,
        time: Date
    }
});

// export ticket model
module.exports = mongoose.model('Ticket', ticketSchema);