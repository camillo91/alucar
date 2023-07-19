var App = (function () {
    'use strict';

    //$('form').submit(false);

    return {

        initialize: function () {
        },

        showAddresses: function () {
            var id = $('#AddressDelivery_Id').val();

            $.get(AppView.actions.getAddressesModal, { id: id })
                .done(function (response) {
                    $('#addresses').html(response);
                    $('#addresses').modal('show');

                    $('#addresses input:radio').change(function () {
                        let id = $(this).data('address-id');
                        
                    })
                });
        },

        deleteAddress: function (id) {
            $.get(AppView.actions.getDeleteAddressConfirm, { id: id })
                .done(function (response) {
                    var $modal = $("#modalContainer");
                    $modal.html(response);
                    $modal.modal('show');
                });
        },

        addDeliveryAddress: function () {
            event.preventDefault();

            $.get(AppView.actions.getDeliveryAddressModal)
                .done(function (response) {
                    var $modal = $("#modalContainer");
                    $modal.html(response);
                    $modal.modal('show');
                });
        },

        editDeliveryAddress: function () {
            event.preventDefault();

            var id = $('#AddressDelivery_Id').val();

            $.get(AppView.actions.getDeliveryAddressModal, { id: id })
                .done(function (response) {
                    var $modal = $("#modalContainer");
                    $modal.html(response);
                    $modal.modal('show');
                });
        },

        saveDeliveryAddressFail: function (xhr, status, error) {

            var model = $(this).serializeToJSON();

            $.post(AppView.actions.getDeliveryAddressModal, model)
                .done(function (response) {
                    var $modal = $("#modalContainer");
                    $modal.html(response);
                });
        },

        saveDeliveryAddress: function () {
            event.preventDefault();
            

            var data = $('#deliveryAddress form').serializeToJSON().AddressDelivery;

            $.post(AppView.actions.saveDeliveryAddress, data)
                .done(function (response) {
                    endEditAddress('#deliveryAddress', '#AddressDelivery_Id', response);
                })
                .fail(function (response) {

                });
        },

        cancelEditDeliveryAddress: function () {
            event.preventDefault();
            cancelEditAddress('#deliveryAddress');
        },

        editInvoiceAddress: function () {
            event.preventDefault();

            var id = $('#AddressInvoice_Id').val();

            $.get(AppView.actions.getInvoiceAddressModal, { id: id })
                .done(function (response) {
                    var $modal = $("#modalContainer");
                    $modal.html(response);
                    $modal.modal('show');
                });
        },

        saveInvoiceAddress: function () {
            event.preventDefault();

            var data = $('#invoiceAddress form').serializeToJSON().AddressInvoice;

            $.post(AppView.actions.saveInvoiceAddress, data)
                .done(function (response) {
                    endEditAddress('#invoiceAddress', '#AddressInvoice_Id', response);
                })
                .fail(function (response) {

                });
        },

        cancelEditInvoiceAddress: function () {
            event.preventDefault();
            cancelEditAddress('#invoiceAddress');
        }
    };
})();

$(document).ready(App.initialize);