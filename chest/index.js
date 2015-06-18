var config = require('./config'),
    express = require('express');

var server = express();
server.use(express.static('./dist'));

server.listen(config.port); 