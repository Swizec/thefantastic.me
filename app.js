

/**
 * Module dependencies.
 */

var express = require('express');
var twitter = require('twitter');
var OAuth = require('oauth').OAuth;
var redis = require('redis').createClient();
var querystring = require('querystring');
var forms = require('forms');

var RedisStore = require('connect-redis')(require('connect'));
var _ = require('underscore');

var users = require('./lib/users');
var settings = require('./settings');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here',
                            store: new RedisStore}));
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

function require_twitter_login(req, res, next) {
    if(!req.session.oauth_access_token) {
	res.redirect("/twitter_login?action="+querystring.escape(req.originalUrl));
	return;
    }
    next();
};

app.get('/', function(req, res){
    if (!req.session.user_id) {
        req.session.user_id = users.create();
    }

    res.render('index', {
        title: 'thefantastic.me'
    });
});

app.get("/twitter_login", function (req, res) {
    var oa = new OAuth("https://api.twitter.com/oauth/request_token",
                       "https://api.twitter.com/oauth/access_token",
                       settings.twitter_key,
                       settings.twitter_secret,
                       "1.0",
                       "http://thefantastic.me/twitter_login/callback?userid="+req.query.userid,
                       "HMAC-SHA1");
    oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
        if (error) {
            console.log('error twitter login');
        }else{
            req.session.oauth_token = oauth_token;
            req.session.oauth_token_secret = oauth_token_secret;

            res.redirect("https://api.twitter.com/oauth/authenticate?oauth_token="+oauth_token);
        }
    });
});

app.get('/twitter_login/callback', function (req, res) {
    var oa = new OAuth("https://api.twitter.com/oauth/request_token",
                       "https://api.twitter.com/oauth/access_token",
                       settings.twitter_key,
                       settings.twitter_secret,
                       "1.0",
                       "http://thefantastic.me/twitter_login/callback",
                       "HMAC-SHA1");
    oa.getOAuthAccessToken(
        req.session.oauth_token,
        req.session.oauth_token_secret,
        req.param('oauth_verifier'),
        function (error, oauth_access_token, oauth_access_token_secret, results2) {
            if (error) {
                console.log('error');
                console.log(error);
            }else{
                req.session.oauth_access_token = oauth_access_token;
                req.session.oauth_access_token_secret = oauth_access_token_secret;

                users.add_twitter(req.session.user_id,
                                  {token: oauth_access_token,
                                   secret: oauth_access_token_secret},
                                 function () {
                                     res.redirect('/');
                                 });
            }
        });
});

app.post('/login', function (req, res) {
    var form = forms.create({
        password: forms.fields.password({required: true}),
        email: forms.fields.email({required: true})
    });

    form.handle(req.body, {
        success: function (form) {
            users.login(req.session.user_id, form.data, function (err, fresh, new_id) {
                if (err) {
                    res.send({error: err.name});
                }else{
                    if (new_id) {
                        req.session.user_id = new_id;
                    }
                    res.send({success: 'data',
                              fresh: fresh});
                }
            });
        },
        error: function (form) {
            res.send({error: 'fail'});
        },
        empty: function (form) {
            res.send({error: 'fail'});
        }
    });
});

app.post('/bio', function(req, res) {
    var user_id = req.session.user_id;
    var bio_id = "bio:"+user_id+":"+(new Date).getTime();

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

    redis.lrem(user_id+':bios', req.params.id, function (err) {
        res.send('');
    });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(80);
  console.log("Express server listening on port %d", app.address().port);
}
