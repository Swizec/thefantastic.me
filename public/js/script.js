$(function(){
    $.timeago.settings.allowFuture = true;
    $.timeago.settings.strings.prefixFromNow = "in";
    $.timeago.settings.strings.suffixFromNow = "";

    try {
        window.mpmetrics = new MixpanelLib("df83e8462fd6c8025c21b737f6be7051");
    } catch(err) {
        var null_fn = function () {};
        window.mpmetrics = {
            track: null_fn,
            track_funnel: null_fn,
            register: null_fn,
            register_once: null_fn,
            register_funnel: null_fn,
            identify: null_fn
        };
    }

    var background = '/images/background/'+(Math.floor(Math.random()*10%2))+'.jpg';

    $("body").css("background", 'url("'+background+'") top center repeat-x');
});

$(function () {
    var Bio = window.Bio = Backbone.Model.extend({
        url: function () {
            return (!this.id) ? '/bio' : '/bio/'+this.id;
        },

        initialize: function () {
            _.bindAll(this, "set_time", "remove");

            this.index = Bios.length;

            this.set_time();
        },

        set_time: function () {
            var time = (new Date((new Date).getTime()+
                                 86400000*this.index));
            this.attributes.time = [time.getUTCFullYear(),
                                    time.getUTCMonth()+1,
                                    time.getUTCDate()].join('-');
            this.attributes.day = this.attributes.time;

            if (this.index < 1) {
                this.attributes.day = 'today';
            }else if (this.index < 2) {
                this.attributes.day = 'tomorrow';
            }
        },

        remove: function () {
            this.destroy();
            //this.view.remove();
        }
    });

    var BioList = window.BioList = Backbone.Collection.extend({
        model: Bio,
        url: '/bios'
    });

    var Bios = window.Bios = new BioList;

    var BioView = window.BioView = Backbone.View.extend({
        tagName: "li",
        template: $("#bio-template"),

        events: {
            "click .remove": "remove_clicked"
        },

        initialize: function () {
            _.bindAll(this, "render", "remove_clicked");
            this.model.bind('change', this.render);
            this.model.view = this;
        },

        render: function () {
            var $el = $(this.el);
            $el.html(this.template.tmpl(this.model.toJSON()));
            if (this.model.index >= 2) {
                $el.find('.timeago').timeago();
            }

            return $el;
        },

        remove_clicked: function (event) {
            this.remove();
            this.model.remove();
        }
    });

    var AppView = window.AppView = Backbone.View.extend({
        el: $("#main"),

        events: {
            "submit form.add": "new_bio"
        },

        initialize: function () {
            _.bindAll(this, "add_bio", "new_bio", "redraw");

            Bios.bind("add", this.add_bio);
            Bios.bind("reset", this.redraw);
            //Bios.bind("remove", this.redraw);

            Bios.fetch();
        },

        add_bio: function (bio) {
            var view = new BioView({model: bio});
            this.$("ul").append(view.render());
        },

        new_bio: function (event) {
            event.preventDefault();

            mpmetrics.track("New bio");

            var bio = new Bio({text: this.$("form input[type='text']").val()});
            bio.save();

            this.$(".add input").val("");

            Bios.add(bio);
        },

        redraw: function() {
            this.$("ul").empty();
            Bios.each(this.add_bio);
        }
    });

    var LoginView = window.LoginView = Backbone.View.extend({
        el: $("#login"),

        state: 0,

        events: {
            "submit": "login",
            "click .submit": "open"
        },

        initialize: function () {
            _.bindAll(this, "login", "logged_in", "twitter", "open");
        },

        login: function (event) {
            event.preventDefault();

            if (this.state == 0) {
                return;
            }

            $.ajax({
                type: 'POST',
                url: '/login',
                data: $.param({email: this.$("input[type='text']").val(),
                               password: this.$("input[type='password']").val()}),
                success: this.logged_in,
                error: function () {
                    console.log("Error", arguments[1], arguments[2]);
                }});

        },

        logged_in: function (data) {
            if (data.fresh) {
                this.twitter();
            }else if (data.error) {
            }else{
                mpmetrics.track("Logged in");
                Bios.fetch();
            }
        },

        twitter: function () {
            this.el.find('a').css("display", "block");
            mpmetrics.track_links(this.el.find('a'), "Clicked twitter");

            var self = this;
            setTimeout(function () {
                self.el.addClass("twitter");
            }, 300);
        },

        open: function (event) {
            if (this.state < 1) {
                mpmetrics.track("Opened login");

                event.preventDefault();

                this.el.addClass("logging_in");
                this.state = 1;
            }
        }
    });

    var App = window.App = new AppView;
    var Login = window.Login = new LoginView;
});
