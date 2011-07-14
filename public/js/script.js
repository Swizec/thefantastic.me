$(function(){
});

$(function () {
    var Bio = window.Bio = Backbone.Model.extend({});

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

        initialize: function () {
            _.bindAll(this, "render");
            this.model.bind('change', this.render);
            this.model.view = this;
        },

        render: function () {
            var $el = $(this.el);
            $el.html(this.template.tmpl(this.model.toJSON()));

            return $el;
        }
    });

    var AppView = window.AppView = Backbone.View.extend({
        el: $("#main"),

        events: {
            "submit form": "new_bio"
        },

        initialize: function () {
            _.bindAll(this, "add_bio", "new_bio");

            Bios.bind("add", this.add_bio);
        },

        add_bio: function (bio) {
            var view = new BioView({model: bio});
            this.$("ul").append(view.render());
        },

        new_bio: function (event) {
            event.preventDefault();

            Bios.add({text: this.$("form input[type='text']").val()});
        }
    });

    var App = window.App = new AppView;
});
