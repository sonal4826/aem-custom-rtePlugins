
(function($, CUI, $document){
    var GROUP = "linespacing",
        SPACE_FEATURE = "line-spacing",
        AEM_APPLY_LINE_SPACE = "aemLineSpaceDialog",
        SENDER = "line-spacing", REQUESTER = "requester", $aemLineSpacePicker,
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        LINE_SPACER_URL = "/apps/weretail/clientlibs/line-spacer.html",
        url = document.location.pathname;

    if( url.indexOf(LINE_SPACER_URL) == 0 ){
        handlePicker();
        return;
    }

    function handlePicker(){
        $document.on("foundation-contentloaded", fillDefaultValues);

        $document.on("click", CANCEL_CSS, sendCancelMessage);

        $document.submit(sentTextAttributes);
    }

    function queryParameters() {
        var result = {}, param,
            params = document.location.search.split(/\?|\&/);

        params.forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }

            param = it.split("=");
            result[param[0]] = param[1];
        });

        return result;
    }

    function setWidgetValue(form, selector, value, enable){
        Coral.commons.ready(form.querySelector(selector), function (field) {
            field.value = _.isEmpty(value) ? "" : decodeURIComponent(value);

            if(enable){
                delete field.disabled;
            }else{
                field.disabled = "disabled";
            }
        });
    }

    function fillDefaultValues(){
        var queryParams = queryParameters(),
            $form = $("form");

        if(_.isEmpty(queryParams.features)){
            return;
        }

        var features = queryParams.features.split(",");

        setWidgetValue($form[0], "[name='./space']", queryParams.space, true);

        $form.css("background-color", "#fff");
    }

    function sentTextAttributes(){
        var message = {
            sender: SENDER,
            action: "submit",
            data: {}
        }, $form = $("form"), $field;

        _.each($form.find("[name^='./']"), function(field){
            $field = $(field);
            message.data[$field.attr("name").substr(2)] = $field.val();
        });

        getParent().postMessage(JSON.stringify(message), "*");
    }

    function sendCancelMessage(){
        var message = {
            sender: SENDER,
            action: "cancel"
        };

        getParent().postMessage(JSON.stringify(message), "*");
    }

    function getParent() {
        if (window.opener) {
            return window.opener;
        }

        return parent;
    }

    addPlugin();

    addPluginToDefaultUISettings();

    addDialogTemplate();

    function addDialogTemplate(){
        var url = Granite.HTTP.externalize(LINE_SPACER_URL) + "?" + REQUESTER + "=" + SENDER;

        var html = "<iframe width='700px' height='500px' frameBorder='0' src='" + url + "'></iframe>";

        if(_.isUndefined(CUI.rte.Templates)){
            CUI.rte.Templates = {};
        }

        if(_.isUndefined(CUI.rte.templates)){
            CUI.rte.templates = {};
        }

        CUI.rte.templates['dlg-' + AEM_APPLY_LINE_SPACE] = CUI.rte.Templates['dlg-' + AEM_APPLY_LINE_SPACE] = Handlebars.compile(html);
    }


    function addPluginToDefaultUISettings(){
        var groupFeature = GROUP + "#" + SPACE_FEATURE,
            toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.fullscreen.toolbar;

        if(toolbar.includes(groupFeature)){
            return;
        }

        toolbar.splice(9, 0, groupFeature);
    }

    var AEMApplyLineSpace = new Class({
        extend: CUI.rte.ui.cui.AbstractDialog,

        toString: "AEMApplyLineSpace",

        initialize: function(config) {
            this.exec = config.execute;
        },

        getDataType: function() {
            return AEM_APPLY_LINE_SPACE;
        }
    });

    function addPlugin(){
        var AEMTouchUiLineSpacePlugin = new Class({
            toString: "AEMTouchUiLineSpacePlugin",

            extend: CUI.rte.plugins.Plugin,

            pickerUI: null,

            getFeatures: function() {
                return [ SPACE_FEATURE ];
            },

            initializeUI: function(tbGenerator) {
                var plg = CUI.rte.plugins;

                addPluginToDefaultUISettings();

                if (!this.isFeatureEnabled(SPACE_FEATURE)) {
                    return;
                }

                this.pickerUI = tbGenerator.createElement(SPACE_FEATURE, this, false, { title: "Select Line Space..." });
                tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 2);

                var groupFeature = GROUP + "#" + SPACE_FEATURE;
                tbGenerator.registerIcon(groupFeature, "separator");
            },

            execute: function (pluginCommand, value, envOptions) {
                var context = envOptions.editContext,
                    ek = this.editorKernel;

                if (pluginCommand != SPACE_FEATURE) {
                    return;
                }

                if(!isValidSelection()){
                    return;
                }

                var selection = CUI.rte.Selection.createProcessingSelection(context),
                    startNode = selection.startNode;

                if ( (selection.startOffset === startNode.length) && (startNode != selection.endNode)) {
                    startNode = startNode.nextSibling;
                }

                var $tag = $(CUI.rte.Common.getTagInPath(context, startNode, "span")),
                    space = $tag.css("line-height"),dialog,dm = ek.getDialogManager(),
                    $container = CUI.rte.UIUtils.getUIContainer($(context.root)),
                    propConfig = {
                        'parameters': {
                            'command': this.pluginId + '#' + SPACE_FEATURE
                        }
                    };

                this.showFontModal(this.getPickerIFrameUrl(this.config.features, space))

                $(window).off('message', receiveMessage).on('message', receiveMessage);

                function isValidSelection(){
                    var winSel = window.getSelection();
                    return winSel && winSel.rangeCount == 1 && winSel.getRangeAt(0).toString().length > 0;
                }

                function receiveMessage(event) {
                    event = event.originalEvent || {};

                    if (_.isEmpty(event.data)) {
                        return;
                    }

                    var message, action;

                    try{
                        message = JSON.parse(event.data);
                    }catch(err){
                        return;
                    }

                    if (!message || message.sender !== SENDER) {
                        return;
                    }

                    action = message.action;

                    if(action === "submit"){
                        ek.relayCmd(pluginCommand, message.data);
                    }

                    dialog.hide();
                }
            },


            showFontModal: function(url){
                var self = this, $iframe = $('<iframe>'),
                    $modal = $('<div>').addClass('aem-line-space coral-Modal');

                $iframe.attr('src', url).appendTo($modal);

                $modal.appendTo('body').modal({
                    type: 'default',
                    buttons: [],
                    visible: true
                });

                $aemLineSpacePicker = $modal;

                $aemLineSpacePicker.aemLineSpacerPlugin = self;

                $modal.nextAll(".coral-Modal-backdrop").addClass("cfm-coral2-backdrop");
            },

            getPickerIFrameUrl: function(features, space){
                var url = Granite.HTTP.externalize(LINE_SPACER_URL) + "?" + REQUESTER + "=" + SENDER;

                if(features === "*"){
					features = [SPACE_FEATURE];
				}
                url = url + "&features=" + features.join(",");
				
                if(!_.isEmpty(space)){
                    url = url + "&space=" + space;
                }

                return url;
            },

            updateState: function(selDef) {
                var hasUC = this.editorKernel.queryState(SPACE_FEATURE, selDef);

                if (this.pickerUI != null) {
                    this.pickerUI.setSelected(hasUC);
                }
            }
        });

        var AEMTouchUiLineSpaceCmd = new Class({
            toString: "AEMTouchUiLineSpaceCmd",

            extend: CUI.rte.commands.Command,

            isCommand: function (cmdStr) {
                return (cmdStr.toLowerCase() == SPACE_FEATURE);
            },

            getProcessingOptions: function () {
                var cmd = CUI.rte.commands.Command;
                return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
            },

            getTagObject: function(textData) {
                var style = "";


                if(!_.isEmpty(textData.space)){
                    style = style + "line-height: " + textData.space + ";";
                }


                return {
                    "tag": "span",
                    "attributes": {
                        "style" : style
                    }
                };
            },

            execute: function (execDef) {
                var textData = execDef.value, selection = execDef.selection,
                    nodeList = execDef.nodeList;

                if (!selection || !nodeList) {
                    return;
                }

                var common = CUI.rte.Common,
                    context = execDef.editContext,
					childNode = $(context.root.childNodes),
                    tagObj = this.getTagObject(textData);
					
				var rootContext = $(context.root);
                var parentNode = $(selection.startNode.parentNode).parent();				
                
				for(var b = 0; b < childNode.length; b++){
					if(((parentNode.context.nodeName === 'LI')) && ((parentNode[0].innerHTML) === (childNode[b].innerHTML))){
						$(context.root.childNode[b].attr('style'), tagObj.attributes.style);
						return true;
					}else if(((selection.startNode.data) === (childNode[b].innerHTML)) || 
					(($(parentNode.context)[0].innerHTML) === (childNode[b].innerHTML))){
						$(context.root.childNode[b].attr('style'), tagObj.attributes.style);
						return true;
					}
				}
            },

            queryState: function(selectionDef, cmd) {
                return false;
            }
        });

        CUI.rte.commands.CommandRegistry.register(SPACE_FEATURE, AEMTouchUiLineSpaceCmd);

        CUI.rte.plugins.PluginRegistry.register(GROUP,AEMTouchUiLineSpacePlugin);
    }
}(jQuery, window.CUI,jQuery(document)));