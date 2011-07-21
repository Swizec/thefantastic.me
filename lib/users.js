
var redis = require('redis').createClient();
var _ = require('underscore');
var twitter = require('twitter');

var settings = require('../settings');

module.exports = {
    create: function (options) {
        var user_id = (new Date).getTime();

        var data = {email: '',
                   password: '',
                   token: '',
                   token_secret: ''};
        _.extend(data, options);

        redis.multi()
            .rpush('users', user_id)
            .hset('user:'+user_id, 'email', data.email)
            .hset('user:'+user_id, 'password', data.password)
            .hset('user:'+user_id, 'index', 0)
            .hset('user:'+user_id, 'token', data.token)
            .hset('user:'+user_id, 'token_secret', data.token_secret)
            .exec(function (err) {
            });

        return user_id;
    },

    get: function (id, callback) {
        callback = callback || function () {};

        redis.hgetall('user:'+id, function (err, user) {
                if (err) {
                    callback(err);
                }else{
                    callback(null, user);
                }
        });
    },

    add_twitter: function (id, data, callback) {
        callback = callback || function () {};

        redis.multi()
            .hset('user:'+id, 'token', data.token)
            .hset('user:'+id, 'token_secret', data.secret)
            .exec(function (err) {
                var twit = new twitter({
                    consumer_key: settings.twitter_key,
                    consumer_secret: settings.twitter_secret,
                    access_token_key: data.token,
                    access_token_secret: data.secret
                });

                twit.updateProfile({}, function (profile) {
                    var bio_id = "bio:"+id+":"+(new Date).getTime();

                    redis.multi()
                        .rpush(id+':bios', bio_id)
                        .set(bio_id, profile.description)
                        .exec(function (err) {
                            callback();
                        });
                });
            });

    },

    login: function (id, data, callback) {
        redis.sismember('emails', data.email, function (err, yes) {
            if (yes) {
                // check email, relogin with different user
            }else{
                redis.multi()
                    .hset('user:'+id, 'email', data.email)
                    .hset('user:'+id, 'password', data.password) // hash
                    .sadd('emails', data.email)
                    .exec(function (err) {
                        callback(err, true);
                    });
            }
        });
    }
};
