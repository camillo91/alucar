var App = (function () {
    'use strict';

    var carDetailsManager = new CarDetailsManager();

    $('form').submit(false);

    function getActiveFilterForm() {
        var form = $('#filter_by_parameters');
        if (form.is(':visible')) {
            return form;
        }

        form = $('#filter_by_car');
        if (form.is(':visible')) {
            return form;
        }

        return null;
    }

    function getRequestData(pageNumber) {
        var form = getActiveFilterForm();
        if (form) {
            var data = form.serializeArray();
            var controlPanel = $('#list_control_panel').serializeArray();
            data = data.concat(controlPanel);
            data.push({ name: "PageNumber", value: pageNumber });
            return data;
        }

        return null;
    };

    function reload() {
        $('#table-rows').infiniteScrollList('reload');
    };

    function initializeView() {
        $('input[data-observer], select[data-observer]').change(function () { reload(); });
        $('button[data-observer]').click(function () { reload(); });
    }

    function initializeTable() {
        var $tableContent = $('#table-rows');

        $('#table-content').perfectScrollbar();
        $tableContent.infiniteScrollList({
            getResultsNextPageUrl: AppData.links.GetTable,
            getRequestData: function (pageNumber) {
                var data = getRequestData(pageNumber);
                return data;
            },
            onInitialised: function () {
                $('#table-content').perfectScrollbar('update');
            },
            onLoading: function () {
                $('#table-content').addClass('loading');
            },
            onLoaded: function () {
                $('#table-content').removeClass('loading');
            }
        });
    }

    return {

        initialize: function () {
            initializeView();
            carDetailsManager.initialize();
            initializeTable();
        },

        reloadByParameterFilter: function () {
            currentPageNumber = 0;
            reload();
        },

        selectPage: function (pageNumber) {
            if (pageNumber != currentPageNumber) {
                currentPageNumber = pageNumber;
                reload();
            }
        }
    };
})();

$(document).ready(App.initialize);