var App = (function () {

    var listController = new ListController({});

    function setNewProductId(id) {
        if (id !== undefined) {
            $('#modal #newProductPriceRow [name="Id"]').val(id);
        }
    }

    function setupModal(content) {
        $('#modal').html(content).modal();
        $('#modal #newProductPriceRow [name="ProductName"]').inputSuggestions({
            selectCallback: function (data) {
                if (data) {
                    setNewProductId(data.value);
                }
            },
            clearCallback: function () {
                setNewProductId('');
            }
        });
        $('#modal #newProductPriceRow button').click(function (event) {
            event.preventDefault();
            addNewProductPrice();
        });
    }

    function addNewProductPrice() {
        const data = {
            Id: $('#modal #newProductPriceRow [name="Id"]').val(),
            Name: $('#modal #newProductPriceRow [name="ProductName"]').val(),
            Price: $('#modal #newProductPriceRow [name="Price"]').val()
        };

        if (isNewProductPriceDataValid(data)) {
            $.post(AppView.actionUrls.getProductPriceRow, data)
                .done(function (response) {
                    $('#modal #individualPrices tbody').append(response);
                })
                .always(clearNewProductInputs);
        }
    }

    function isNewProductPriceDataValid(data) {
        return data && data.Id && data.Name && data.Price;
    }

    function clearNewProductInputs() {
        $('#modal #newProductPriceRow [name="Id"]').val('');
        $('#modal #newProductPriceRow [name="ProductName"]').val('');
        $('#modal #newProductPriceRow [name="Price"]').val('');
    }

    return {
        initialize: function () {
            listController.initialize();
            listController.reloadResultsList();
        },

        openGroupEditModal: function (el, groupId, url) {
            $(el).attr('disabled', true);

            $.get(url, { groupId: groupId })
                .done(function (content) {
                    setupModal(content);
                })
                .always(function () {
                    $(el).attr('disabled', false);
                });
        },

        onGroupSaveSuccess: function (response) {
            if (response) {
                $('#modal').html(response);
            }
            else {
                $('#modal').modal("hide");
            }
        },

        deleteProductPrice: function (element) {
            $(element).closest('tr').remove();
        }
    };
})();

$(document).ready(App.initialize);

