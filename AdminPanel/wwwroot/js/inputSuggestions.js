$.fn.inputSuggestions = function (settings) {
    var BOX_TEMPLATE = '<div class="suggestions-box"></div>';
    var OFFSET_FROM_INPUT = 4;

    var $input = $(this);

    if (settings === undefined) {
        settings = {};
    }

    if (settings.dataSource === undefined) {
        settings.dataSource = {
            paramName: 'keyword'
        }
    }

    if (settings.inputDebounce === undefined) {
        settings.inputDebounce = 250;
    }

    if (settings.onlySuggestions === undefined) {
        settings.onlySuggestions = true;
    }

    if (settings.dataSource.url === undefined && $input.data('inputSuggestions')) {
        settings.dataSource.url = $input.data('inputSuggestions');
    }

    validateSettingsRequiredProperties();


    var $window = $(window);
    var $body = $(document.body);
    var $box = null;
    var $selectedItem = null;
    var currentInputValue = $(this).val();

    var enabled = false;
    var currentRequest = null;
    var requestTimeout = null;

    hookUpEventListeners();

    function validateSettingsRequiredProperties() {
        if (settings === undefined) throw 'Missing required settings object.';
        if (settings.dataSource === undefined) throw 'Missing required dataSource settings.';
        if (settings.dataSource.url === undefined) throw 'Missing required dataSource.url setting.';
    }

    function hookUpEventListeners() {
        $window.on('resize', positionBox);

        $input.on('focus', enable);
        $input.on('blur', onInputBlurred);
        $input.on('input', onInputChange);
        $input.on('keydown', onInputKeyDown);
    }

    function onWrapperScrolled() {
        $input.trigger('blur');
    }

    function onInputBlurred() {
        if (!$input.val() && currentInputValue == "") {
            raiseSettingCallback('clearCallback');
        }
        else {
            if (settings.onlySuggestions) {
                $input.val(currentInputValue);
            }
            else {
                if (currentInputValue) {
                    $input.val(currentInputValue);
                }
                else if ($input.val()) {


                    raiseSettingCallback('selectCallback', getSelectedItemData());
                }
            }
        }

        disable();
    }

    function getSelectedItemData() {
        if ($selectedItem) {
            return $selectedItem.data();
        }

        return {};
    }

    function onInputChange() {
        requestSuggestions();
    }

    function requestSuggestions() {
        var input = $input.val();

        clearTimeout(requestTimeout);

        if (input.length || settings.requestEmptyString) {
            requestTimeout = setTimeout(function () {
                makeRequestForKey(input);
            }, settings.inputDebounce);
        }
    }

    function makeRequestForKey(key) {
        abortCurrentRequest();

        var options = {
            url: settings.dataSource.url,
            data: prepareRequestData(key)
        };

        currentRequest = $.ajax(options).done(onRequestComplete);
    }

    function prepareRequestData(key) {
        var data = settings.dataSource.data != undefined ? settings.dataSource.data : {};

        if (typeof (data) == 'function') {
            data = data(key);
        }

        if (settings.dataSource.paramName != undefined) {
            data[settings.dataSource.paramName] = key;
        }
        return data;
    }

    function abortCurrentRequest() {
        if (currentRequest !== null) {
            currentRequest.abort();
            currentRequest = null;
        }
    }

    function onInputKeyDown(e) {
        if (!enabled || currentRequest !== null) {
            return;
        }

        var allowDefault = false;

        switch (e.which) {
            case 13: // Enter
                //var hasInputAnyLetter = $input.val() !== "";
                if ($selectedItem !== null) {
                    console.log("Enter $selectedItem !== null");
                    applySelectedItem();
                    focusNextInput(this);
                }
                else {
                    console.log("Enter $selectedItem == null");
                    $input.blur();
                }
                break;

            case 27: // Esc
                disable();
                break;

            case 38: // Up arrow
                selectPreviousItem();
                break;

            case 40: // Down Arrow
                selectNextItem();
                break;

            case 9: // Tab
                selectOnlyItem();
                allowDefault = true;
                break;

            default:
                currentInputValue = '';
                return;
        }

        e.stopPropagation();

        if (!allowDefault)
            e.preventDefault();
    }

    function onRequestComplete(data) {
        if (data !== null && enabled) {
            loadSuggestions(data);
        }

        currentRequest = null;
    }

    function loadSuggestions(data) {
        if ($box === null) {
            createBox();
        }

        $box.html(data);
        $box.find('.content-wrapper').perfectScrollbar(AppCore.getPerfectScrollbarDefaultConfig());

        var $items = $box.find('*[data-suggestion-item]');
        $items.on('mouseover', onItemMouseOver);
        $items.on('click', onItemClick);
    }

    function onItemMouseOver() {
        selectItem($(this));
    }

    function onItemClick() {
        $selectedItem = $(this);
        applySelectedItem();
    }

    function enable() {
        enabled = true;
        currentInputValue = $input.val();

        requestSuggestions();
    }

    function disable() {
        if ($box !== null) {
            destroyBox();
        }

        enabled = false;
    }

    function applySelectedItem() {
        var actionValue = $selectedItem.attr('data-action');
        var action = eval(actionValue);

        if (typeof action === 'function') {
            action();
        }

        currentInputValue = $selectedItem.attr('data-suggestion-item');
        $input.blur();

        raiseSettingCallback('selectCallback', getSelectedItemData());
    }

    function selectOnlyItem() {
        if ($box) {
            if ($box.find('*[data-suggestion-item]').length !== 1) return;

            $selectedItem = $box.find('*[data-suggestion-item]').first();

            applySelectedItem();
        }
    }

    function selectNextItem() {
        var $nextItem;

        if ($selectedItem === null) {
            $nextItem = $box.find('*[data-suggestion-item]:first');
        }
        else {
            $nextItem = $selectedItem.next();

            if (!$nextItem.length) {
                $nextItem = $box.find('*[data-suggestion-item]:first');
            }
        }

        selectItem($nextItem);
    }

    function selectPreviousItem() {
        var $prevItem;

        if ($selectedItem === null) {
            $prevItem = $box.find('*[data-suggestion-item]:last');
        }
        else {
            $prevItem = $selectedItem.prev();

            if (!$prevItem.length) {
                $prevItem = $box.find('*[data-suggestion-item]:last');
            }
        }

        selectItem($prevItem);
    }

    function focusNextInput(element) {
        var inputs = $(':input.form-control');
        if (inputs.length > 0) {
            var nextInput = inputs.get(inputs.index(element) + 1);
            if (nextInput) {
                nextInput.focus();
            }
        }
    }

    function selectItem($item) {
        const $items = $box.find('*[data-suggestion-item]');

        $items.removeClass('active');
        $item.addClass('active');

        $selectedItem = $item;

        if ($box) {
            const $wrapper = $box.find('.content-wrapper');

            if ($item.position().top < 0) {
                const scrollTop = $wrapper.scrollTop() + $item.position().top;
                $wrapper.scrollTop(scrollTop);
            }
            else {
                const distanceBottom = $wrapper.height() - ($item.position().top + $item.outerHeight());

                if (distanceBottom < 0) {
                    const scrollTop = $wrapper.scrollTop() - distanceBottom;
                    $wrapper.scrollTop(scrollTop);
                }
            }
        }
    }

    function createBox() {
        $box = $(BOX_TEMPLATE);
        positionBox();

        $body.append($box);

        $box.on('mousedown', function (event) {
            event.preventDefault();
        });

        if (settings.hideOnWrapperScrolled) {
            $(settings.hideOnWrapperScrolled).on('scroll', onWrapperScrolled);
            $(window).on('scroll', onWrapperScrolled);
        }

        $selectedItem = null;
    }

    function destroyBox() {
        if ($box !== null) {
            $box.remove();
            $box = null;

            if (settings.hideOnWrapperScrolled) {
                $(settings.hideOnWrapperScrolled).off('scroll', onWrapperScrolled);
                $(window).off('scroll', onWrapperScrolled);
            }
        }
    }

    function positionBox() {
        if ($box == null)
            return;

        var inputBounds = $input[0].getBoundingClientRect();
        var topOffset = window.pageYOffset + (inputBounds.top + inputBounds.height) + OFFSET_FROM_INPUT;
        var leftOffset = window.pageXOffset + inputBounds.left;

        $box.css({
            top: topOffset,
            left: leftOffset,
            minWidth: inputBounds.width,
            maxWidth: window.innerWidth - leftOffset - 15
        });
    }

    function raiseSettingCallback(callbackName, data) {
        var callback = settings[callbackName];

        if (callback !== undefined) {
            if (typeof callback !== 'function') {
                throw 'Expected ' + callbackName + ' setting to be a function';
            }

            callback(data);
        }
    }
};