var App = (function () {

    var listController = new ListController({});

    function finishEditRegistration() {
        $('#modal').modal('hide');
        listController.reloadResultsList();
    }

    function openAddNewCusomerModal(url, dataModel) {
        AppCore.showDialog({
            url: url,
            model: dataModel,
        });
    }

    return {
        initialize: function () {
            listController.initialize();
            listController.reloadResultsList();
        },

        openRegistrationDetailsModal: function (element, id, url) {
            $(element).attr('disabled', true);

            $.get(url, { id: id })
                .done(function (content) {
                    $('#modal').html(content).modal();
                })
                .always(function () {
                    $(element).attr('disabled', false);
                });
        },

        onActivateRegistrationSuccess: function (response) {
            if (response) {
                if (response.addNewCustomer) {
                    openAddNewCusomerModal(response.getAddNewCustomerModalUrl, response.customerEditModel)
                }
                else if (response.editModal) {
                    $('#modal').html(response.editModal);
                }
                else {
                    finishEditRegistration();
                }
            }
            else {
                finishEditRegistration();
            }
        },

        customerSaveSuccess: function (response) {
            $('#modal').modal('hide');
            listController.reloadResultsList();
        }
    };
})();

$(document).ready(App.initialize);

