$(function(){
});

$(function () {
    var Bio = window.Bio = Backbone.Model.extend({
        url: function () {
            return (!this.id) ? '/bio' : '/bio/'+this.id;
        }
    });

    var BioList = window.BioList = Backbone.Collection.extend({
        model: Bio,
        url: '/bios',

        initialize: function () {
        }
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
            "submit form": "new_bio"
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

    var App = window.App = new AppView;
});
