$(function(){
    now.ready(function(){
        now.initiate(function (clientId) {
            console.log("I am client "+clientId);

            now.get_bio(function (bio) {
                console.log("Your bio: "+bio);
            });
        });
    });
});
