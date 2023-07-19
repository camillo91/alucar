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

        $('#tireKeywordSearch').change(function () {
            $.post(AppData.links.GetFilterDataForTireKeywordSearch, { keyword: $(this).val() })
                .done(function (response) {
                    if (response) {
                        updateFilterByParameters(response);
                        reload();
                    }
                });
        });
    }

    function updateFilterByParameters(data) {
        const $filter = $('#filter_by_parameters');

        setFilterPropertyValue($filter, 'TireWith', data.tireWith);
        setFilterPropertyValue($filter, 'TireProfile', data.tireProfile);
        setFilterPropertyValue($filter, 'TireDiameter', data.tireDiameter);
        setFilterPropertyValue($filter, 'TireSeason', data.tireSeason);
    }

    function setFilterPropertyValue($filter, propertyName, value) {
        const $input = getFilterByParametrsInput($filter, propertyName, value);

        if ($input) {
            $input.val(value);
        }
    }

    function getFilterByParametrsInput($filter, name) {
        const $input = $filter.find('[name="Filter.FilterByParameters.' + name + '"]');

        if ($input.length) {
            return $input;
        }

        return null;
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

        selectPage: function (pageNumber) {
            if (pageNumber != currentPageNumber) {
                currentPageNumber = pageNumber;
                reload();
            }
        }
    };
})();

$(document).ready(App.initialize);