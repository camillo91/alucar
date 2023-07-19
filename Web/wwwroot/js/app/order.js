var App = (function () {
    'use strict';

    $('form').submit(false);

    function getRequestData(pageNumber) {
        var form = $('form');
        if (form) {
            var data = form.serializeArray();
            //var controlPanel = $('#list_control_panel').serializeArray();
            //data = data.concat(controlPanel);
            data.push({ name: "PageNumber", value: pageNumber });
            return data;
        }

        return null;
    };

    function reload() {
        var data = getRequestData();
        $.post(AppData.links.getList, data, function (result) {
            if (result) {
                var $wrapper = $('#wheel-set-tables-wrapper');
                $wrapper.html(result)
                $wrapper.find('[data-table-scroller]').perfectScrollbar();
                initializeInfiniteScroll();
            }
        });
    };

    function initializeInfiniteScroll() {
        $('#wheel-set-tables-wrapper').find('[data-infinite-scroll-url]').each(function () {
            var $this = $(this);
            var url = $this.data('infinite-scroll-url');
            $(this).infiniteScrollList({
                currentPageNumber: 1,
                autoLoad: false,
                getResultsNextPageUrl: url,
                getRequestData: getRequestData
            })
        });
    }

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