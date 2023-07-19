var TableManager = function (settings) {
    'use strict';

    var self = this;

    var tables = [];
    var dialogModalManager = settings.dialogModalManager;

    function getTableName(element) {
        var top = $(element).closest('[data-table-name]');
        if (top) {
            return $(top).data('table-name');
        }
        return null;
    }

    function doTableAction(arg, action) {
        if (arg && typeof (action) === 'function') {
            var tableName = $.type(arg) === 'string' ? arg : getTableName(arg);
            if (tableName) {
                var table = tables[tableName];
                if (table) {
                    return action(table);
                }
            }
        }
        return null;
    }

    function onEditDialogShow(dialogContext) {
        if (typeof (dialogContext.table.onEditDialogShow) === 'function') {
            dialogContext.table.onEditDialogShow(dialogContext);
        }
    }

    function onEditDialogSubmit(dialogContext) {

        if (typeof (dialogContext.table.onEditDialogSubmit) === 'function') {
            dialogContext.table.onEditDialogSubmit(dialogContext);
        }

        var $form = $(dialogContext.dialogContent).find('form');
        var getRowUrl = dialogContext.table.getEditRowUrl();

        if (getRowUrl) {
            $.post({
                url: getRowUrl,
                data: $form.serialize()
            }).done(function (content) {
                $(dialogContext.dialogModal).modal('hide');

                if (dialogContext.row) {
                    dialogContext.table.replaceRow(dialogContext.row, $(content));
                }
                else {
                    dialogContext.table.addRow($(content));
                }
            }).fail(function (xhr, status) {
                dialogContext.method = 'POST';
                dialogContext.onClose = null;
                dialogContext.model = $form.serialize();
                dialogModalManager.showDialog(dialogContext);
            });
        }
    }

    self.addTable = function (tableSettings) {
        var table = new TableObject(self, tableSettings);
        if (table.tableName) {
            tables[table.tableName] = table;
        }
    };

    self.getTable = function (tableName) {
        return tables[tableName];
    };

    self.addNewRow = function (tableName) {
        doTableAction(tableName, function (table) {
            table.disableButtons();
            var model = table.getEmptyModel();
            var dialogUrl = table.getEditDialogUrl();

            if (dialogUrl) {
                dialogModalManager.showDialog({
                    method: 'GET',
                    url: dialogUrl,
                    model: model,
                    table: table,
                    autoClose: false,
                    onShow: onEditDialogShow,
                    onSubmit: onEditDialogSubmit,
                    onClose: function () {
                        table.enableButtons();
                    }
                });
            }
            else if (table.getEditRowUrl()) {
                CancelableRequests.register('tableManagerGetNewRow',
                    $.post(table.getEditRowUrl(), model, function (content) {
                        if (content) {
                            table.addRow($(content));
                        }
                    }).always(function () {
                        table.enableButtons();
                    }));
            }
        });
    };

    self.deleteRow = function (el) {
        doTableAction(el, function (table) {
            table.disableButtons();

            if (table.confirmDeleteRow) {
                dialogModalManager.showConfirmDialog(table.confirmDeleteRowDialogTitle, table.confirmDeleteRowDialogMessage,
                    function () {
                        table.deleteRow($(el).closest('[data-table-row]'));
                    },
                    function () {
                        table.enableButtons();
                    }
                );
            }
            else {
                table.deleteRow($(el).closest('[data-table-row]'));
                table.enableButtons();
            }
        });
    };

    self.togglePreviewRow = function (el) {
        doTableAction(el, function (table) {
            var row = $(el).closest('[data-table-row]');
            var previewRow = row.find('[data-preview-row]');
            previewRow.toggle();
        });
    };

    self.clear = function (tableName) {
        doTableAction(tableName, function (table) {
            table.clear();
        });
    }

    self.editRow = function (el) {
        doTableAction(el, function (table) {
            table.disableButtons();
            var row = $(el).closest('[data-table-row]');
            var dialogUrl = table.getEditDialogUrl();

            if (row && dialogUrl) {
                dialogModalManager.showDialog({
                    url: dialogUrl,
                    model: table.getRowModel(row),
                    table: table,
                    row: row,
                    autoClose: false,
                    onShow: onEditDialogShow,
                    onSubmit: onEditDialogSubmit,
                    onClose: function () {
                        table.enableButtons();
                    }
                });
            }
        });
    };

    self.eachRows = function (tableName, fn) {
        doTableAction(tableName, function (table) {
            table.eachRows(fn);
        });
    };

    self.getRowByIndex = function (tableName, index) {
        return doTableAction(tableName, function (table) {
            return table.getRowByIndex(index);
        });
    };

    self.getRowModelByIndex = function (tableName, index) {
        return doTableAction(tableName, function (table) {
            var row = table.getRowByIndex(index);
            if (row) {
                return table.getRowModel(row);
            }
            return null;
        });
    };

    function TableObject(tableManager, tableSettings) {

        tableSettings.tableSelector = tableSettings.tableSelector ? tableSettings.tableSelector :
            (tableSettings.tableName ? '[data-table-name="' + tableSettings.tableName + '"]' : null);

        if (tableSettings.tableSelector == null) throw 'Missing required tableSelector or tableName settings.';

        var self = this;
        self.data = tableSettings;
        self.tableManager = tableManager;
        var $tableContainer = tableSettings.tableSelector ? $(tableSettings.tableSelector) : null;
        var $tableView = null;
        var $tableRows = null;

        self.confirmDeleteRow = tableSettings.confirmDeleteRow;
        self.confirmDeleteRowDialogTitle = tableSettings.confirmDeleteRowDialogTitle;
        self.confirmDeleteRowDialogMessage = tableSettings.confirmDeleteRowDialogMessage;
        self.onEditDialogShow = tableSettings.onEditDialogShow;
        self.onEditDialogSubmit = tableSettings.onEditDialogSubmit;

        function refreshTableViewVisibility() {
            var hasRows = $tableRows.children().length > 0;
            $tableView.toggle(hasRows);
        }

        function renumberRows() {
            $tableRows.find('[data-table-cell-rownumber]').each(function (idx) {
                $(this).html(idx + 1);
            });
        }

        function getCellValues(columnIdx) {
            let values = [];
            $tableRows.find('[data-table-column-index="' + columnIdx + '"]').map(function (idx, el) {
                let val = $(el).data('table-cell-value');
                val = $.isNumeric(val) ? Number(val) : null;
                values.push(val);
            });
            return values;
        }

        function updateTotalCell($cell, values) {
            if (values && values.length) {
                let sum = values.reduce(function (total, val) {
                    if (val) {
                        return total ? total + val : val;
                    }
                    return total;
                });

                if (sum != null) {
                    //$cell.html(sum);
                    $cell.autoNumeric(sum);
                }
                else {
                    $cell.empty();
                }
            }
        }

        function refreshAutoTotalCells() {
            if (self.data.autoTotal) {
                let cells = $tableContainer.find('[data-table-total-cell]');
                for (let i = 0; i < cells.length; i++) {
                    let $cell = $(cells[i]);
                    let columnIdx = $cell.data('table-total-cell');
                    let values = getCellValues(columnIdx);
                    updateTotalCell($cell, values);
                }
            }
        }

        function toggleDisablingButtons(disable) {
            disable = disable ? true : false;

            $.each($tableContainer.find('[data-table-button]'), function () {
                $(this).attr('disabled', disable);
            });
        }

        function refreshButtonsClickEvent($container) {
            $.each($container.find('[data-table-button]'), function (idx, el) {
                let $el = $(el);
                let type = $el.data('table-button');
                $el.off('click');

                switch (type) {
                    case 'add':
                        $el.click(function () {
                            self.tableManager.addNewRow(self.tableName);
                        });
                        break;
                    case 'edit':
                        $el.click(function () {
                            self.tableManager.editRow(this);
                        });
                        break;
                    case 'delete':
                        $el.click(function () {
                            self.tableManager.deleteRow(this);
                        });
                        break;
                    case 'toggle':
                        $el.click(function () {
                            self.tableManager.togglePreviewRow(this);
                        });
                        break;
                }
            });

        }

        if ($tableContainer && $tableContainer.length) {
            self.tableName = $tableContainer.data('table-name');
            $tableView = $tableContainer.find('[data-table-view]');
            $tableView = $tableView.length ? $tableView : $tableContainer;
            $tableRows = $tableView.find('[data-table-rows]');

            renumberRows();
            refreshAutoTotalCells();
            refreshButtonsClickEvent($tableContainer);
            refreshTableViewVisibility();
        }

        self.getEditDialogUrl = function () {
            return typeof (self.data.editDialogUrl) === 'function' ? self.data.editDialogUrl() : self.data.editDialogUrl;
        };

        self.getEditRowUrl = function () {
            return typeof (self.data.editRowUrl) === 'function' ? self.data.editRowUrl() : self.data.editRowUrl;
        };

        self.getEmptyModel = function () {
            return typeof (self.data.emptyModel) === 'function' ? self.data.emptyModel() : (self.data.emptyModel ? self.data.emptyModel : {});
        };

        self.getRowModel = function (row) {
            var array = $(row).find('input').serializeArray();
            var tableName = this.tableName;
            var index = array.find(function (el) { return el.name === tableName + '.index'; });
            index = index ? index.value : null;
            if (index != null) {
                var model = {};
                var prefix = tableName + '[' + index + '].';
                var prefixLen = prefix.length;
                var fieldRegexp = /^([^\[]+)\[(.+)]\.(.+)/g;

                var setObjField = function (obj, fieldName, value) {
                    var match = fieldRegexp.exec(fieldName);
                    if (match) {
                        let array = match[1];
                        let idx = match[2];
                        let field = match[3];
                        if (obj[array] === undefined) {
                            obj[array] = [];
                        }
                        if (obj[array][idx] === undefined) {
                            obj[array][idx] = {};
                        }
                        setObjField(obj[array][idx], field, value);
                    }
                    else {
                        obj[fieldName] = value;
                    }
                }

                array.map(function (el) {
                    if (el.name.startsWith(prefix)) {
                        var fieldName = el.name.substr(prefixLen);
                        setObjField(model, fieldName, el.value);
                    }
                });
            }
            return model;
        };

        self.getRowData = function (row) {
            var data = {};
            var cells = $(row).find('[data-table-column-index]').map(function (idx, el) {
                var $el = $(el);
                var index = $el.data('table-column-index');
                var text = $el.html().trim();
                var value = $el.data('table-cell-value');
                data[index] = { value: value, text: text };
            });
            return data;
        };

        self.getRowIndex = function (row) {
            return $(row).find('input[name="' + self.tableName + '.index"]').val();
        };

        self.getRowFieldId = function (row, fieldName) {
            var index = self.getRowIndex(row);
            return ['#', self.tableName, '_', index, '__', fieldName].join('');
        };

        self.getRowFieldName = function (row, fieldName) {
            var index = self.getRowIndex(row);
            return [self.tableName, '[', index, '].', fieldName].join('');
        };

        self.getRowByIndex = function (index) {
            return $tableRows.find('input[value="' + index + '"]').closest('[data-table-row]');
        };

        self.addRow = function ($row) {
            if ($tableRows && $tableRows.length > 0) {
                $row.appendTo($tableRows);
                renumberRows();
                refreshAutoTotalCells();
                refreshTableViewVisibility();
                refreshButtonsClickEvent($row);
                if (typeof (self.data.onAddRow) === 'function') {
                    self.data.onAddRow($row, this);
                }
            }
        };

        self.addRows = function (rows) {
            if ($tableRows && $tableRows.length) {
                var $rows = $(rows);
                $rows.appendTo($tableRows);
                renumberRows();
                refreshAutoTotalCells();
                refreshTableViewVisibility();
                refreshButtonsClickEvent($rows);
                if (typeof (self.data.onAddRows) === 'function') {
                    self.data.onAddRows($rows, this);
                }
            }
        };

        self.deleteRow = function (row) {
            row.remove();
            renumberRows();
            refreshAutoTotalCells();
            refreshTableViewVisibility();
        };

        self.replaceRow = function ($row, $content) {
            $row.replaceWith($content);
            renumberRows();
            refreshAutoTotalCells();
            refreshButtonsClickEvent($content);
        };

        self.clear = function () {
            $tableRows.empty();
            refreshAutoTotalCells();
            refreshTableViewVisibility();
        };

        self.eachRows = function (fn) {
            if ($tableRows && $tableRows.length) {
                var rows = $tableRows.find('[data-table-row]');
                for (let i = 0; i < rows.length; i++) {
                    fn(i, rows[i], this);
                }
            }
        };

        self.disableButtons = function () {
            toggleDisablingButtons(true);
        };

        self.enableButtons = function () {
            toggleDisablingButtons(false);
        };

        if (typeof (self.data.onInitialized) === 'function') {
            self.data.onInitialized(self);
        }

        return self;
    }
};