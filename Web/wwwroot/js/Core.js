var CarDetailsManager = function (settings) {

    if (settings == undefined) {
        settings = {};
    }

    if (settings.selector == undefined) {
        settings.selector = "[data-car-details]";
    }

    if (settings.controllerUrl == undefined) {
        settings.controllerUrl = "/CarDetails/";
    }

    var $container = $(settings.selector);
    var $brandSelect = null;
    var $modelSelect = null;
    var $typeSelect = null;
    var $generationSelect = null;
    var $wheelSizeSelect = null;

    if ($container && $container.length) {
        $brandSelect = $container.find('select[data-car-brand]');
        $modelSelect = $container.find('select[data-car-model]');
        $typeSelect = $container.find('select[data-car-type]');
        $generationSelect = $container.find('select[data-car-generation]');
        $wheelSizeSelect = $container.find('select[data-car-wheelsize]');
    }

    function getOptionsActionUrl(type) {
        return [settings.controllerUrl, 'GetCar', type, 'Options'].join('');
    }

    function cleanSelect($select) {
        $select.empty().append('<option value="">Wybierz</option>');
    }

    function updateSelectOptions(type, data, $select) {
        $.post(getOptionsActionUrl(type), data, function (result) {
            if (result) {
                $select.append(result);
            }
        });
    }

    function updateModelSelect() {
        cleanSelect($modelSelect);
        var brandId = $brandSelect.val();
        if (brandId) {
            updateSelectOptions("Model", { carBrandId: brandId, brandId: brandId }, $modelSelect);
        }
    }

    function updateTypeSelect() {
        cleanSelect($typeSelect);
        var modelId = $modelSelect.val();
        if (modelId) {
            updateSelectOptions("Type", { modelId: modelId }, $typeSelect);
        }

    }

    function updateGenerationSelect() {
        cleanSelect($generationSelect);
        var modelId = $modelSelect.val();
        var typeName = $typeSelect.val();
        if (modelId && typeName) {
            updateSelectOptions("Generation", { modelId: modelId, typeName: typeName }, $generationSelect);
        }
    }

    function updateWheelSizeSelect() {
        cleanSelect($wheelSizeSelect);
        var modelId = $modelSelect.val();
        var typeName = $typeSelect.val();
        var generation = $generationSelect.val();
        if (modelId && typeName) {
            updateSelectOptions("WheelSize", { modelId: modelId, typeName: typeName, generation: generation }, $wheelSizeSelect);
        }
    }

    function initializeChangedEvents() {
        $brandSelect.change(function () { updateModelSelect(); });
        $modelSelect.change(function () { updateTypeSelect(); });
        $typeSelect.change(function () {
            updateGenerationSelect();
            updateWheelSizeSelect();
        });
        $generationSelect.change(function () { updateWheelSizeSelect(); })
    }

    return {
        initialize: function () {
            initializeChangedEvents();
        }
    }
};
var CartManager = function (settings) {

    var controller = settings.controller ? settings.controller : 'Cart';
    var $cartContainer = null;
    var mutationObserver = null;

    function initializeCartButtons() {
        $('#cart-container [data-cart-btn="popup"]').click(function ($event) {
            $event.preventDefault();
            $cartContainer.toggleClass('cart-collapse');
        });

        $('#cart-container [data-cart-btn="del"]').click(function (event) {
            event.preventDefault();
            deleteFromCart(this);
        });

        $('[data-cart-btn="modal"]').click(function (event) {
            event.preventDefault();
            showModal();
        });
    }

    function initializeScrollableItemList() {
        $('.cart-popup [data-scrollable]').perfectScrollbar();
    }

    function updateCartModal(response) {
        $('#cartModal table tbody').html(response.body);
        $('#cartModal table tfoot').html(response.footer);
        $cartContainer.html(response.popup);
        initializeCartButtons();
        initializeScrollableItemList();
        initializeModal();
    }

    function initializeModal() {
        $('#cartModal [data-cart-btn="del"]').click(function (event) {
            event.preventDefault();
            var $this = $(this);
            var id = $this.data('cartId');

            $.post(controller + '/DeleteFromCartModal', { id: id }).done(function (response) {
                updateCartModal(response);
            });
        });

        $('#cartModal [data-quantity]').change(function (event) {
            event.preventDefault();
            var $this = $(this);
            var id = $this.closest('[data-cart-id]').data('cartId');

            $.post(controller + '/ChangeQuantityOnCartModal', { id: id, quantity: $this.val() })
                .done(function (response) {
                    updateCartModal(response);
                });
        });
    }

    function initializeMutationObserver(view) {
        mutationObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    $(node).find('[data-cart-btn="add"]').on('click', function (event) {
                        event.preventDefault();
                        addToCartInternal(this);
                    });
                });
            });
        });

        var loadableContents = null;

        if (typeof (view) == 'undefined') {
            loadableContents = $('[data-loadable-content]');
        }
        else {
            loadableContents = $(view).find('[data-loadable-content]');
        }

        loadableContents.each(function () {
            mutationObserver.observe(this, {
                attributes: false,
                characterData: true,
                childList: true,
                subtree: true,
                attributeOldValue: false,
                characterDataOldValue: false
            });
        });
    }


    function addToCartInternal(el) {
        var data = $(el).closest('form').serializeToJSON();

        $.post(controller + '/AddToCart', data).done(function (result) {
            $cartContainer.html(result);
            initializeCartButtons();
            initializeScrollableItemList();
        })
    }

    function deleteFromCart(el) {
        var id = $(el).data('cartId');

        $.post(controller + '/DeleteFromCart', { id : id }).done(function (result) {
            $cartContainer.html(result);
            initializeCartButtons();
            initializeScrollableItemList();
        })
    }

    function showModal() {
        $.post(controller + '/GetCartModal').done(function (response) {
            $('#cartModal table tbody').html(response.body);
            $('#cartModal table tfoot').html(response.footer);
            $('#cartModal').modal('show');
            initializeModal();
        });
    }

    return {
        initialize: function () {
            $cartContainer = $('#cart-container');
            initializeCartButtons();
            initializeScrollableItemList();
            initializeModal();
            initializeMutationObserver();

            $('#cartModal').on('show.bs.modal', function () {
                $cartContainer.addClass('cart-collapse');
            });
        },

        initializeCartActionButtons: function (view) {
            initializeMutationObserver(view);
        },

        addToCard: addToCartInternal
    };
};
var AppCore = function (settings) {

    var cartMgr = new CartManager({});


    return {
        initialize: function () {
            cartMgr.initialize();
        },

        initializeCartActionButtons: function (view) {
            cartMgr.initializeCartActionButtons(view);
        },

        addToCart: function (el) {
            cartMgr.addToCart(el);
        },

        submit: function (el) {
            var form = $(el).closest('form');
            if (form) {
                form.submit();
            }
        }
    };
};

$(document).ready(function () {
    AppCore = new AppCore();
    AppCore.initialize();
});


var FilterManager = function (setings) {

};
$.fn.infiniteScrollList = function (settings) {

    var infiniteScroll = $(this).data('infiniteScroll');

    if (infiniteScroll) {
        if (settings === 'reload') {
            infiniteScroll.reload();
        }
    }
    else {
        var $resultsListElement = $(this);
        var $resultsListContainer = $resultsListElement.closest('[data-infinite-list-container]');

        if (!$resultsListContainer.length) {
            $resultsListContainer = settings.listContainerID ? $resultsListElement.closest('#' + settings.listContainerID) : $resultsListElement.parent();
        }

        var initialising = true;
        var resultsPageLoading = false;
        var resultsCurrentPage = settings.currentPageNumber ? settings.currentPageNumber : 0;
        var resultsMaxPageReached = false;
        var autoLoad = settings.autoLoad === false ? false : true;

        function loadResultsNextPage() {
            resultsPageLoading = true;

            if (typeof (settings.onLoading) === 'function') {
                settings.onLoading();
            }

            var data = null;

            if (typeof (settings.getRequestData) === 'function') {
                data = settings.getRequestData(resultsCurrentPage + 1);
            }
            else {
                data = {
                    PageNumber: resultsCurrentPage + 1
                };
            }

            if (typeof (settings.resultsPageData) === 'function') {
                settings.resultsPageData(data);
            }

            $.post(settings.getResultsNextPageUrl, data)
                .done(function (res) {
                    $resultsListElement.append(res.contentHtml);

                    if (res.isLastPage) {
                        resultsMaxPageReached = true;
                    }
                    else {
                        resultsCurrentPage++;
                    }
                })
                .always(function () {
                    resultsPageLoading = false;

                    if (typeof (settings.onLoaded) === 'function') {
                        settings.onLoaded();
                    }

                    if (initialising) {
                        initialising = false;

                        if (typeof (settings.onInitialised) === 'function') {
                            settings.onInitialised();
                        }
                    }
                });
        }

        function onResultsListContainerScroll() {
            if (!resultsPageLoading && !resultsMaxPageReached) {
                var distance = $resultsListElement.height() - ($resultsListContainer.scrollTop() + $resultsListContainer.height());

                if (distance <= 500) {
                    loadResultsNextPage();
                }
            }
        }

        if (typeof (settings.onInitialising) === 'function') {
            settings.onInitialising();
        }

        $resultsListContainer.on('scroll', onResultsListContainerScroll);

        infiniteScroll = {
            reload: function () {
                $resultsListElement.empty();
                $resultsListContainer.scrollTop(0);
                resultsCurrentPage = 0;
                resultsMaxPageReached = false;
                loadResultsNextPage();
            }
        };
        $resultsListElement.data('infiniteScroll', infiniteScroll);

        if (autoLoad) {
            loadResultsNextPage();
        }
    }
}
