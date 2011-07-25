$(function(){
    $.timeago.settings.allowFuture = true;
    $.timeago.settings.strings.prefixFromNow = "in";
    $.timeago.settings.strings.suffixFromNow = "";
});

$(function () {
    var Bio = window.Bio = Backbone.Model.extend({
        url: function () {
            return (!this.id) ? '/bio' : '/bio/'+this.id;
        },

        initialize: function () {
            _.bindAll(this, "set_time");

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
        }
    });

    var BioList = window.BioList = Backbone.Collection.extend({
        model: Bio,
        url: '/bios'
    });

    var Bios = window.Bios = new BioList;

    var BioView = window.BioView = Backbone.View.extend({
        tagname: "li",
        template: $("#bio-template"),

        events: {
            "click .remove": "remove"
        },

        initialize: function () {
            _.bindAll(this, "render", "remove");
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

        remove: function (event) {
            event.preventDefault();

            this.model.destroy();
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
            Bios.bind("remove", this.redraw);

            Bios.fetch();
        },

        add_bio: function (bio) {
            var view = new BioView({model: bio});
            this.$("ul").append(view.render());
        },

        new_bio: function (event) {
            event.preventDefault();

            var bio = new Bio({text: this.$("form input[type='text']").val()});
            bio.save();

            Bios.add(bio);
        },

        redraw: function() {
            this.$("ul").empty();
            Bios.each(this.add_bio);
        }
    });

    var LoginView = window.LoginView = Backbone.View.extend({
        el: $("#login"),

        events: {
            "submit": "login"
        },

        initialize: function () {
            _.bindAll(this, "login", "logged_in", "twitter");
        },

        login: function (event) {
            event.preventDefault();

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
            this.$("input").hide();

            if (data.fresh) {
                this.twitter();
            }else{
                Bios.fetch();
            }
        },

        twitter: function () {
            this.$("a").show();
        }
    });

    var App = window.App = new AppView;
    var Login = window.Login = new LoginView;
});
