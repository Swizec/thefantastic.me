
var redis = require('redis').createClient();
var _ = require('underscore');
var twitter = require('twitter');
var crypto = require('crypto');

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
            .hset('user:'+user_id, 'password', hash(data.password))
            .hset('user:'+user_id, 'index', 0)
            .hset('user:'+user_id, 'token', data.token)
            .hset('user:'+user_id, 'token_secret', data.token_secret)
            .exec(function (err) {
                if (data.email) {
                    redis.hset('email-id:'+data.email, user_id);
                }
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
                redis.hget('email-id', data.email, function (err, real_id) {
                    if (err) {
                        callback(err);
                    }else{
                        redis.hget('user:'+real_id, 'password', function (err, password) {
                            if (password === hash(data.password)) {
                                callback(null, false, real_id);
                            }else{
                                callback(new BadPassword, false);
                            }
                        });
                    }
                });
            }else{
                redis.multi()
                    .hset('user:'+id, 'email', data.email)
                    .hset('user:'+id, 'password', hash(data.password)) // hash
                    .sadd('emails', data.email)
                    .hset('email-id', data.email, id)
                    .exec(function (err) {
                        callback(err, true);
                    });
            }
        });
    }
};


function hash(password) {
    var sha1 = crypto.createHash('sha512'),
        sha2 = crypto.createHash('sha512');

    sha1.update(password+settings.salt);
    sha2.update(settings.salt+sha1.digest('hex'));

    return sha2.digest('hex');
}

function BadPassword(msg) {
    this.name = 'BadPassword';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}
