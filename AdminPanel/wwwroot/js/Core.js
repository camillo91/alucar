var CancelableRequests = (function () {
    var requests = {};

    return {
        add: function (name, jqxhr) {
            requests[name] = jqxhr;
        },

        abort: function (name) {
            var lastJqxhr = requests[name];

            if (lastJqxhr) {
                lastJqxhr.abort();
                delete requests[name];
            }
        },

        // abort + add
        register: function (name, jqxhr) {
            var lastJqxhr = requests[name];

            if (lastJqxhr) {
                lastJqxhr.abort();
            }

            requests[name] = jqxhr;
        }
    };
})();

/*
$.fn.inputPassword = function (settings) {
    
    const $input = $(this);
    let password = '';

    if ($input.data().inputPassword !== undefined) {
        console.log('input password:' + $input.data().inputPassword);

        const $inputPassword = $input.closest('form').find('#' + $input.data().inputPassword);

        $input.on('keyup', function (e) {
            let val = $(this).val();
            const lastChar = val.substr(val.length - 1);

            if (lastChar && lastChar != '*') {
            }
        })
    }
};
*/

var AppCore = (function () {
    'use strict';

    const dialogManager = new DialogModalManager({
        dialogModalSelector: 'body > #modal',
        secondDialogModalSelector: 'body > #secondModal',
        systemDialogModalSelector: 'body > #systemModal',

        onDialogShow: function (dialogContext) {
            setupDialog(dialogContext)
        }
    });

    function setupDialog(dialogContext) {
        dialogContext.dialogContent.find('input').each(function () {
            const $this = $(this);

            if (!$this.is(':checkbox')) {
                if ($this.val()) {
                    $this.closest('.form-group').toggleClass('is-filled', true);
                }
            }

            $this.on('input', function () {
                $(this).closest('.form-group').toggleClass('is-filled', $(this).val() ? true : false);
            })
        });
    }

    function showDialog(options) {
        dialogManager.showDialog(options);
    }

    return {
        getPerfectScrollbarDefaultConfig: function () {
            return {
                minScrollbarLength: 6
            };
        },

        showDialog: showDialog,
        showConfirmDialog: dialogManager.showConfirmDialog
    };
})();