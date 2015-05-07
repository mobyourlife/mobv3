var fs = require('fs'),
    http = require('http'),
    https = require('https'),
    httpProxy = require('http-proxy');

var isHttps = true; // do you want a https proxy?

var options = {
    https: {
        key: fs.readFileSync('./config/cert.key'),
        cert: fs.readFileSync('./config/cert.pem')
    }
};

// this is the target server
var proxy = httpProxy.createProxyServer({
    target: {
        host: '127.0.0.1',
        port: 3200
    }
});

https.createServer(options.https, function(req, res) {
        proxy.proxyRequest(req, res);
    }).listen(443, function(err) {
        if (err) {
            console.log('Error serving HTTPS proxy request: %s', req);
        }
        console.log('Created HTTPS proxy successfully.');
    }
);