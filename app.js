

/**
 * Module dependencies.
 */

var express = require('express');
var twitter = require('twitter');
var redis = require('redis').createClient();
var _ = require('underscore');

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
    if (!req.session.user_id) {
        req.session.user_id = (new Date).getTime();
    }

    res.render('index', {
        title: 'thefantastic.me'
    });
});

app.post('/bio', function(req, res) {
    var user_id = req.session.user_id;
    var bio_id = user_id+":"+(new Date).getTime();

    redis.multi()
        .rpush(user_id+':bios', bio_id)
        .set(bio_id, req.body.text)
        .exec(function (err) {
            res.send({id: bio_id});
        });
});

app.get('/bios', function (req, res) {
    var user_id = req.session.user_id;

    redis.lrange(user_id+':bios', 0, -1, function (err, ids) {
        redis.mget(ids, function (err, texts) {
            if (texts) {
                res.send(_.map(_.zip(ids, texts),
                               function (bio) {
                                   return {id: bio[0],
                                           text: bio[1]};
                               }));
            }else{
                res.send([]);
            }
        });
    });
});

app.delete('/bio/:id', function (req, res) {
    var user_id = req.session.user_id;

    redis.zrem(user_id+':bios', req.params.id, function (err) {
        res.send('');
    });
});

var users = [];

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
