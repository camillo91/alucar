var DialogModalManager = function (settings) {
    'use strict';

    const $modal = $(settings.dialogModalSelector);
    const $secondModal = settings.secondDialogModalSelector ? $(settings.secondDialogModalSelector) : null;
    const $systemModal = settings.systemDialogModalSelector ? $(settings.systemDialogModalSelector) : null;

    let self = this;
    let onCloseHandlers = [];
    let currentModalLevel = -1;
    let modalStack = [];
    let $currentModal = null;

    self.onDialogShow = settings.onDialogShow;
    self.dialogControllerUrl = settings.dialogControllerUrl ? settings.dialogControllerUrl : '/DialogManager';
    self.alertDialogUrl = settings.alertDialogUrl;
    self.confirmDialogUrl = settings.confirmDialogUrl;

    $modal.on('hidden.bs.modal', function () {
        $.each(onCloseHandlers, function () {
            if (typeof (this) === 'function') {
                this();
            }
        });

        onCloseHandlers = [];
        popModalLevel();
    });

    $secondModal.on('hidden.bs.modal', function () {
        $.each(onCloseHandlers, function () {
            if (typeof (this) === 'function') {
                this();
            }
        });

        onCloseHandlers = [];
        popModalLevel();
    });

    function pushModalLevel() {
        currentModalLevel++;

        switch (currentModalLevel) {
            case 0:
                $currentModal = $modal;
                break;

            case 1:
                $currentModal = $secondModal;
                break;

            default:
                throw 'Maximum level reached of multiple modals';
        }

        modalStack[currentModalLevel] = $currentModal;
    }

    function popModalLevel() {
        modalStack[currentModalLevel] = null;
        currentModalLevel--;

        if (currentModalLevel >= 0) {
            $currentModal = modalStack[currentModalLevel];
        }
        else {
            $currentModal = null;
        }
    }

    function initDialog(options) {
        if (options.content) {
            var $content = $(options.content);
            var $form = $content.find('form');

            pushModalLevel();

            if ($form.length) {
                $form.submit(function (event) {
                    event.preventDefault();

                    if (options.autoClose === undefined || options.autoClose !== false) {
                        //$modal.modal('hide');
                        $currentModal.modal('hide');
                    }

                    if (typeof (options.onSubmit) === 'function') {
                        options.onSubmit(options);
                    }
                });
            }

            if (typeof (options.onClose) === 'function') {
                onCloseHandlers.push(options.onClose);
            }

            if (typeof (options.onDialogShown) === 'function') {
                /*
                $modal.one('shown.bs.modal', function () {
                    options.onDialogShown();
                });
                */
                $currentModal.one('shown.bs.modal', function () {
                    options.onDialogShown();
                });
            }

            /*
            $modal.empty();
            $content.appendTo($modal);
            $modal.modal();
            */

            $currentModal.empty();
            $content.appendTo($currentModal);
            $currentModal.modal();

            options.dialogContent = $content;
            //options.dialogModal = $modal;
            options.dialogModal = $currentModal;

            if (typeof (self.onDialogShow) === 'function') {
                self.onDialogShow(options);
            }

            if (typeof (options.onShow) === 'function') {
                options.onShow(options);
            }
        }
    }

    function showDialog(options) {
        if (!options) throw 'Missing required options object.';
        if (currentModalLevel >= 1) throw 'Maximum level reached of multiple modals';

        if (options.url) {
            options.method = options.method ? options.method : 'POST';

            CancelableRequests.register('dialogManagerGetDialogView',
                $.ajax({
                    url: options.url,
                    method: options.method,
                    data: options.model
                }).done(function (ajaxContent) {
                    options.content = ajaxContent;
                    initDialog(options);
                })
            );
        }
        else if (options.content) {
            initDialog(options);
        }
    }

    function getDialogUrlByType(dialogType) {
        if (self.dialogControllerUrl) {
            return [self.dialogControllerUrl, '/Get', dialogType, 'Dialog'].join('');
        }
        return null;
    }

    function initDialogs($container) {
        $.each($container.find('[data-dialog-type]'), function () {
            var $this = $(this);
            var type = $this.data('dialog-type');
            var url = getDialogUrlByType(type);
            if (url) {
                var action = $this.data('dialog-submit-action');
                var options = {
                    url: url,
                    model: {
                        Title: $this.data('dialog-title'),
                        Message: $this.data('dialog-message')
                    },
                    onSubmit: function () {
                        if (action) {
                            eval(action);
                        }
                    },
                    autoClose: $this.data('dialog-autoclose') === 'false' ? false : true
                };
                $this.off('click');
                $this.click(function () {
                    showDialog(options);
                });
            }
        });
    }

    self.showDialog = function (options) {
        showDialog(options);
    };

    self.showAlertDialog = function (message, title) {
        var url = self.alertDialogUrl ? self.alertDialogUrl : getDialogUrlByType('Alert');

        if (url) {
            showDialog({
                url: url,
                model: {
                    Title: title,
                    Message: message
                }
            });
        }
    };

    self.showConfirmDialog = function (title, message, onSubmit, onClose) {
        var options = {
            model: {
                Title: title,
                Message: message
            },
            onSubmit: onSubmit,
            onClose: onClose
        };

        options.url = self.confirmDialogUrl ? self.confirmDialogUrl : getDialogUrlByType('Confirm');
        showDialog(options);
    };

    self.showProgressDialog = function (title, message, ajaxUrl, ajaxData, onSuccess) {
        var url = getDialogUrlByType('Progress');
        if (url) {
            showDialog({
                url: url,
                model: {
                    Title: title,
                    Message: message
                },
                onShow: function (dialogContext) {
                    CancelableRequests.register('showProgressDialog',
                        $.post(ajaxUrl, ajaxData, onSuccess)
                            .always(function () {
                                $modal.modal('hide');
                            }));
                }
            });
        }
    };

    self.initialize = function () {
        initDialogs($(document));
    };

    return self;
};