var App = (function () {

    var listController = new ListController({});

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
        $('#modal').html(content).modal();

        $('#modal input').each(function () {
            const $this = $(this);

            if ($this.val()) {
                $this.closest('.form-group').toggleClass('is-filled', true);
            }

            $this.on('input', function () {
                $(this).closest('.form-group').toggleClass('is-filled', $(this).val() ? true : false);
            })
        });

        $('#modal input[data-input-suggestions]').each(function () {
            const $this = $(this);
            const $valueElement = $('#modal #' + $this.data().valueElementId);

            $this.inputSuggestions({
                selectCallback: function (data) {
                    $this.closest('.form-group').toggleClass('is-filled', true);

                    if (data && $valueElement) {
                        $valueElement.val(data.value);
                    }
                },
                clearCallback: function () {
                    $this.closest('.form-group').toggleClass('is-filled', false);

                    if ($valueElement) {
                        $valueElement.val('');
                    }

                }
            });
        });
        /*
        $('#modal input[data-input-password]').each(function () {
            $(this).inputPassword();
        });
        */
    }

    function closeModal() {
        $('#modal').modal('hide');
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

        accountSaveSuccess: function (response) {
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

