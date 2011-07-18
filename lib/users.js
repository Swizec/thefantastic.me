
var redis = require('redis').createClient();

module.exports = {
    create: function () {
        var user_id = (new Date).getTime();

        redis.multi()
            .rpush('users', user_id)
            .hset('user:'+user_id, 'email', '')
            .hset('user:'+user_id, 'password', '')
            .hset('user:'+user_id, 'index', 0)
            .hset('user:'+user_id, 'token_key', '15353121-xhWkOl2u1rMxEOywKLvwCMtyUx21NhV9zQ9AI4')
            .hset('user:'+user_id, 'token_secret', 'GSTpss3ptNsD9QEP2xfMIK0V2E2bnVYur62sVKrRxiw')
            .exec(function (err) {
            });

        return user_id;
    },

    get: function (id, callback) {
        callback = callback || function () {};

        redis.multi()
            .hget('user:'+id, 'email')
            .hget('user:'+id, 'password')
            .hget('user:'+id, 'index')
            .hget('user:'+id, 'token_key')
            .hget('user:'+id, 'token_secret')
            .exec(callback);
    }
};
