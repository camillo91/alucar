var App = (function () {

    const listController = new ListController({});
    const carsSelector = new CarsSelector();
    let modalCarSelector = null;

    listController.onAddButtonClick = function (e) {
        const $button = $(e.target);
        const url = $button.data().url;

        $button.attr('disabled', true);

        $.get(url)
            .done(function (content) {
                setupModal(content);
            })
            .always(function () {
                $button.attr('disabled', false);
            });
    };

    function setupView() {
    }

    function setupModal(content) {
        AppCore.showDialog({
            content: content
        })

        modalCarSelector = new CarsSelector($('#modal'));
    }

    function closeModal() {
        $('#modal').modal('hide');
       modalCarSelector = null;
    }

    return {
        initialize: function () {
            listController.initialize();
            setupView();
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

        saveSuccess: function (response) {
            if (response) {
                setupModal(response);
            }
            else {
                closeModal();
                listController.reloadResultsList();
            }
        }
    };
})();

$(document).ready(App.initialize);

