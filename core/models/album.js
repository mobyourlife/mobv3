// app/models/album.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var albumSchema = mongoose.Schema({
    _id: String,
    ref: { type: String, ref: 'Fanpage' },
    name: String,
    type: String,
    count: Number,
    path: String,
    time: Date,
    special: String,
    latest_sync: Date,
    error: {
        time: Date,
        request: String,
        info: String
    }
});

// export user model
module.exports = mongoose.model('Album', albumSchema);