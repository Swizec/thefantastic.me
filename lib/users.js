
var redis = require('redis').createClient();
var _ = require('underscore');

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
    }
};
