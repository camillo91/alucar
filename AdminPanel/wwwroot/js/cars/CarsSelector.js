var CarsSelector = function ($container) {
    'use strict';

    $container = $container ? $container : $('body');

    const self = this;
    const $brandSelect = $container.find('[data-brand-select]');
    const $modelSelect = $container.find('[data-model-select]');
    const $typeSelect = $container.find('[data-type-select]');

    if ($brandSelect.length) {
        $brandSelect.change(onChangeBrand);
    }

    if ($modelSelect.length) {
        $modelSelect.change(onModelSelect);
    }

    function onChangeBrand() {
        if ($modelSelect.length) {
            const val = $brandSelect.val();
            $.get($modelSelect.data().url, { brandId: val })
                .done(function (response) {
                    applySelectOptions($modelSelect, response);
                    onModelSelect();
                });
        }
    }

    function onModelSelect() {
        if ($typeSelect.length) {
            const val = $modelSelect.val();
            $.get($typeSelect.data().url, { modelId: val })
                .done(function (response) {
                    applySelectOptions($typeSelect, response);
                });
        }
    }

    function applySelectOptions($select, optionsList) {
        const options = renderOptions(optionsList);
        $select.empty();
        $select.append(options);
    }

    function renderOptions(optionsList) {

        return optionsList.map(opt => `<option value='${opt.value}'>${opt.text}</option>`).join('');
    }

}