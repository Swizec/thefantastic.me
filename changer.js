
var twitter = require('twitter');
var redis = require('redis').createClient();
var _ = require('underscore');

var settings = require('./settings');

var users = require('./lib/users');

var change = function (user_id) {
    users.get(user_id, function (err, user) {
        redis.lindex(user_id+":bios", user.index, function (err, bio_id) {
            redis.get(bio_id, function (err, bio) {

                if (bio) {
                    var twit = new twitter({
                        consumer_key: settings.twitter_key,
                        consumer_secret: settings.twitter_secret,
                        access_token_key: user.token_key,
                        access_token_secret: user.token_secret
                    });

                    twit.updateProfile({description: bio}, function () {
                        redis.hincrby("user:"+user_id, 'index', 1, function () {
                            console.log("changed to", bio);
                        });
                    });
                }
            });
        });
    });
};

var change_all = function () {
    redis.lrange('users', 0, -1, function (err, users) {
        users.map(change);
    });
};

if (!module.parent) {
//    setInterval(change_all, 86400000); // once a day
    change_all();
}
