var App = (function () {

    var listController = new ListController({});

    function setupModal(content) {
        $('#modal').html(content).modal();
    }

    function closeModal() {
        $('#modal').modal('hide');
    }

    return {
        initialize: function () {
            listController.initialize();
            listController.reloadResultsList();
        },

        openEditModal: function (el, id, url) {
            $(el).attr('disabled', true);

            $.get(url, { id: id })
                .done(function (content) {
                    setupModal(content);
                })
                .always(function () {
                    $(el).attr('disabled', false);
                });
        },

        orderSaveComplete: function (response) {
            closeModal();
        },

        orderSaveSuccess: function (response) {
            if (response && response.id) {
                $('[data-row="' + response.id + '"]').replaceWith(response.rowContentHtml);
            }
        }
    };
})();

$(document).ready(App.initialize);

