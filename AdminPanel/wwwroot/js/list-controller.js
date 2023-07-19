var ListController = function (settings) {
    'use strict';

    var self = this;

    var resultsPageLoading = false;
    var resultsCurrentPage = 0;
    var resultsMaxPageReached = false;

    const $listViewTableTop = $('#listViewTableTop');
    const $listScrollerElement = $('[data-infinite-scroll]');
    const $listContentElement = $('[data-infinite-scroll-content]');


    function getFilterData(key) {
        var data = $listViewTableTop.find('form').serializeArray().reduce(function (obj, item) {
            obj[item.name] = item.value;
            return obj;
        }, {});

        data.keyword = key;

        return data;
    }

    function getRequestData() {
        var data = getFilterData();

        //data.SortMethod = $('#sortMethod').val();
        data.PageNumber = resultsCurrentPage;

        return data;
    }

    function initializeMainTable() {
    }

    function toggleLoading(loading) {
        /*
        $('.filter-side-bar .filter-inner').toggleClass('loading', loading);
        $('.data-quality-results-card .card-block').toggleClass('loading', loading);
        */
    }

    function reloadResultsList() {
        CancelableRequests.abort('resultsLoading');

        if ($listContentElement.length) {

            $listContentElement.scrollTop(0);

            if (typeof (settings.onBeforeReloadList) === 'function') {
                settings.onBeforeReloadList();
            }

            resultsCurrentPage = 1;
            resultsMaxPageReached = false;
            resultsPageLoading = true;
            toggleLoading(resultsPageLoading);

            var requestData = getRequestData();

            CancelableRequests.add('resultsLoading', $.post(AppView.actionUrls.getList, requestData, function (res) {
                const $content = $(res.contentHtml);
                initializeTableContentButtons($content);
                $listContentElement.html($content);

                initializeMainTable();
                $listContentElement.scrollTop(0);

                if (res.IsLastPage) {
                    resultsMaxPageReached = true;
                }
                else {
                    resultsCurrentPage++;
                }
            })
                .always(function () {
                    resultsPageLoading = false;
                    toggleLoading(resultsPageLoading);
                })
            );
        }
    }


    function loadResultsNextPage() {
        if ($listContentElement.length) {
            resultsPageLoading = true;

            var requestData = getRequestData();

            $.post(AppView.actionUrls.getList, requestData, function (res) {
                const $content = $(res.contentHtml);
                initializeTableContentButtons($content);
                $listContentElement.append($content);

                if (res.returnUrl) {
                    window.history.replaceState(null, document.title, res.ReturnUrl);
                }

                initializeMainTable();

                if (res.isLastPage) {
                    resultsMaxPageReached = true;
                }
                else {
                    resultsCurrentPage++;
                }
            })
                .always(function () {
                    resultsPageLoading = false;
                    toggleLoading(resultsPageLoading);
                });
        }
    }

    function initializeTableTop() {
        if ($listViewTableTop.length) {
            $listViewTableTop.find('form').submit(function (e) {
                e.preventDefault();
            });

            initializeTableTopInputElements();
            initializeTableTopInputSuggestions();
            initialiTableTopEvents();
            initializeTableTopButtons();
        }
    }

    function initializeTableTopInputElements() {
        $listViewTableTop.find('input').each(function () {
            const $this = $(this);

            if ($this.val()) {
                $this.closest('.form-group').toggleClass('is-filled', true);
            }

            $this.on('input', function () {
                $(this).closest('.form-group').toggleClass('is-filled', $(this).val() ? true : false);
            })
        });
    }

    function initializeTableTopInputSuggestions() {
        $listViewTableTop.find('[data-input-suggestions]').each(function () {
            const $this = $(this);
            const $propertyElement = getPropertyElement($this.data().propertyName);

            $this.inputSuggestions({
                dataSource: {
                    data: function (key) {
                        return getFilterData(key);
                    },
                },
                selectCallback: function (data) {
                    $this.closest('.form-group').toggleClass('is-filled', true);

                    if (data) {
                        if ($propertyElement) {
                            $propertyElement.val(data.value);
                        }
                    }

                    reloadResultsList();
                },
                clearCallback: function () {
                    $this.closest('.form-group').toggleClass('is-filled', false);

                    if ($propertyElement) {
                        $propertyElement.val('');
                    }

                    reloadResultsList();
                }
            });
        });
    }

    function initialiTableTopEvents() {
        $listViewTableTop.find('[data-observable]').change(reloadResultsList);
    }

    function initializeTableTopButtons() {
        $listViewTableTop.find('[data-button]').each(function () {
            const $this = $(this);
            const buttonType = $this.data().button;

            switch (buttonType) {
                case "add":
                    $this.click(onAddButtonClick);
                    break;
            }
        });
    }

    function initializeTableContentButtons($content) {
        $content.find('[data-button]').each(function () {
            const $this = $(this);
            const buttonType = $this.data().button;

            switch (buttonType) {
                case 'delete':
                    $this.click(function () {
                        onDeleteButtonClick($this)
                    });
                    break;
            }
        });
    }

    function onAddButtonClick(e) {
        if (self.onAddButtonClick) {
            self.onAddButtonClick(e);
        }
    }

    function onDeleteButtonClick($button) {
        const url = $button.data().url
        const title = $button.data().title
        const msg = $button.data().msg
        AppCore.showConfirmDialog(title, msg, function () {
            $.post(url, { id: $button.data().id }, reloadResultsList)
        })
    }

    function getPropertyElement(propertyName) {
        if (propertyName) {
            return $listViewTableTop.find('[name="' + propertyName + '"]');
        }

        return null;
    }

    function initializeInfiniteScroll() {
        if ($listScrollerElement.length && $listContentElement.length) {
            $listScrollerElement.scroll(function () {
                if (!resultsPageLoading && !resultsMaxPageReached) {
                    const distance = $listContentElement.height() - ($listScrollerElement.scrollTop() + $listScrollerElement.height());

                    if (distance <= 500) {
                        loadResultsNextPage();
                    }
                }
            });
        }
    }

    self.initialize = function () {
        initializeTableTop();
        initializeInfiniteScroll();
    };

    self.reloadResultsList = reloadResultsList;

    self.onAddButtonClick = null;
}