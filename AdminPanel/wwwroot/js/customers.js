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
        /*
        $('#modal').html(content).modal();

        $('#modal input').each(function () {
            const $this = $(this);

            if ($this.val()) {
                $this.closest('.form-group').toggleClass('is-filled', true);
            }

            $this.on('input', function () {
                console.log('input:' + $(this).val());
                $(this).closest('.form-group').toggleClass('is-filled', $(this).val() ? true : false);
            })
        });
        */

        AppCore.showDialog({
            content: content
        })

        $('#modal #HasDeliveryAddressChecked').change(function () {
            toggleDeliveryAddressAvailability($(this).is(':checked'));
        });
    }

    function toggleDeliveryAddressAvailability(available) {
        $('#modal #deliveryAddress input').each(function () {
            $(this).prop('disabled', !available);

            if (!available) {
                $(this).val('');
            }
        });
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

        customerSaveComplete: function (response) {
            
        },

        customerSaveSuccess: function (response) {
            if (response) {
                setupModal(response);
            }
            else {
                closeModal();
                listController.reloadResultsList();
            }
        },

        editAccount: function (el, id) {
            event.preventDefault();
            const $el = $(el);
            const data = $el.data();

            if (data.url) {
                AppCore.showDialog({
                    method: 'GET',
                    url: data.url,
                    model: { id: id, parentEditModalContext: true}
                });
            }
        },

        accountSaveSuccess: function (response) {
            console.log('save success')
        }
    };
})();

$(document).ready(App.initialize);

