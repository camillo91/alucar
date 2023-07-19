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