(function(){
    var GROUP = "strikethrough",
        FEATURE = "strike-through";

    addPluginToDefaultUISettings();
	function addPluginToDefaultUISettings(){
		
		var groupFeature = GROUP + "#" + FEATURE,
            toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.fullscreen.toolbar;

        if(toolbar.includes(groupFeature)){
            return;
        }

        toolbar.splice(8, 0, groupFeature);
    }
	
    TouchUIStrikethroughPlugin = new Class({
        toString: "TouchUIStrikethroughPlugin",

        extend: CUI.rte.plugins.Plugin,

        pickerUI: null,

        getFeatures: function() {
            return [ FEATURE ];
        },

        initializeUI: function(tbGenerator) {
            var plg = CUI.rte.plugins;

            if (!this.isFeatureEnabled(FEATURE)) {
                return;
            }

            this.pickerUI = tbGenerator.createElement(FEATURE, this, true, "Strikethrough Plugin");
            tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 120);

            var groupFeature = GROUP + "#" + FEATURE;
            tbGenerator.registerIcon(groupFeature, "globeStrike");
        },

        execute: function(id) {
            this.editorKernel.relayCmd(id);
        },

        //to mark the uppercase icon selected/deselected
        updateState: function(selDef) {
            var hasUC = this.editorKernel.queryState(FEATURE, selDef);

            if (this.pickerUI != null) {
                this.pickerUI.setSelected(hasUC);
            }
        },

        notifyPluginConfig: function(pluginConfig) {
            pluginConfig = pluginConfig || { };

            var defaults = {
                "tooltips": {
                    "touchuitouppercase": {
                        "title": "Strikethrough",
                        "text": "Strikethrough"
                    }
                }
            };

            CUI.rte.Utils.applyDefaults(pluginConfig, defaults);

            this.config = pluginConfig;
        }
    });

    CUI.rte.plugins.PluginRegistry.register(GROUP,TouchUIStrikethroughPlugin);

    var TouchUIStrikethroughCmd = new Class({
        toString: "TouchUIStrikethroughCmd",

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr) {
            return (cmdStr.toLowerCase() == FEATURE);
        },

        getProcessingOptions: function() {
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
        },

        _getTagObject: function() {
            return {
                "tag": "span",
                "attributes": {
                    "style" : "text-decoration:line-through"
                }
            };
        },

        execute: function(execDef) {
            var selection = execDef.selection;

            if (!selection) {
                return;
            }

            var nodeList = execDef.nodeList;

            if (!nodeList) {
                return;
            }

            var common = CUI.rte.Common;
            var context = execDef.editContext;

            var tagObj = this._getTagObject();

            var tags = common.getTagInPath(context, selection.startNode, tagObj.tag, tagObj.attributes);

            if (tags == null) {
                nodeList.surround(execDef.editContext, tagObj.tag, tagObj.attributes);
            } else {
                nodeList.removeNodesByTag(execDef.editContext, tagObj.tag, tagObj.attributes, true);
            }
        },

        queryState: function(selectionDef, cmd) {
            var common = CUI.rte.Common;
            var context = selectionDef.editContext;

            var selection = selectionDef.selection;
            var tagObj = this._getTagObject();

            return (common.getTagInPath(context, selection.startNode, tagObj.tag, tagObj.attributes) != null);
        }
    });

    CUI.rte.commands.CommandRegistry.register(FEATURE, TouchUIStrikethroughCmd);
})();