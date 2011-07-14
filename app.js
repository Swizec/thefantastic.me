
/**
 * Module dependencies.
 */

var express = require('express');
var twitter = require('twitter');
var redis = require('redis').createClient();

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

var twit = new twitter({
    consumer_key: 'Y5sXGAPLegOrONX6QYsdmQ',
    consumer_secret: 'efjsSrum0ggRtWztMhLUEGI7Bj6CmokZVwUUujbUO4',
    access_token_key: '15353121-xhWkOl2u1rMxEOywKLvwCMtyUx21NhV9zQ9AI4',
    access_token_secret: 'GSTpss3ptNsD9QEP2xfMIK0V2E2bnVYur62sVKrRxiw'
});

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

app.post('/bio', function(req, res) {
    var id = (new Date).getTime();

    redis.zadd('bios', id, req.body.text);

    res.send({id: id});
});

var users = [];

// TODO: when users vanish do some cleaning up so as to not hold their group indefinitely

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
