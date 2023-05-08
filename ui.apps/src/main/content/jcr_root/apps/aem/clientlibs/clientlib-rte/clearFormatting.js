(function(){
    var GROUP = "clearFormat",
        FEATURE = "clear-Format";

    addPluginToDefaultUISettings();
	function addPluginToDefaultUISettings(){
		
		var groupFeature = GROUP + "#" + FEATURE,
            toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.fullscreen.toolbar;

        if(toolbar.includes(groupFeature)){
            return;
        }

        toolbar.splice(9, 0, groupFeature);
    }
	
    TouchUIClearFormatPlugin = new Class({
        toString: "TouchUIClearFormatPlugin",

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

            this.pickerUI = tbGenerator.createElement(FEATURE, this, true, "Clear Formatting Plugin");
            tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 120);

            var groupFeature = GROUP + "#" + FEATURE;
            tbGenerator.registerIcon(groupFeature, "adjust");
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
                        "title": "To clear all The Formatting",
                        "text": "To clear all The Formatting"
                    }
                }
            };

            CUI.rte.Utils.applyDefaults(pluginConfig, defaults);

            this.config = pluginConfig;
        }
    });

    CUI.rte.plugins.PluginRegistry.register(GROUP,TouchUIClearFormatPlugin);

    var TouchUIClearFormatCmd = new Class({
        toString: "TouchUIClearFormatCmd",

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr) {
            return (cmdStr.toLowerCase() == FEATURE);
        },

        getProcessingOptions: function() {
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_SELECTION | cmd.PO_BOOKMARK | cmd.PO_NODELIST;
        },

        execute: function(execDef) {
            var selection = execDef.selection;

            if (!selection) {
                return;
            }
            var common = CUI.rte.Common;
			var context = execDef.editContext;
			var rawTxt;
			if(context != null && context != undefined){
				var htmlString = $('.coral-RichText-editable').html();
				const htmlNode = context.createElement('div');
				htmlNode.innerHTML =  htmlString;
				htmlNode.querySelectorAll('*').forEach(function (node){
					node.removeAttribute('style');
					node.removeAttribute('type');
					node.removeAttribute('class');
				});
				
				var rawHtml = htmlNode.innerHTML;
				rawTxt = rawHtml.replace(/((<ol>|<ul>|<span>|<u>|<b>|<i>)|(<\/ol>|<\/ul>|<\/span>|<\/u>|<\/b>|<\/i>))/g, "")
				.replace(/<[^\/][^>]*>/g, "</p>")
				.replace(/<p>\s*<\/p>/g, "");
			    $(context.root).html(rawTxt);
			}

        },

    });

    CUI.rte.commands.CommandRegistry.register(FEATURE, TouchUIClearFormatCmd);
})();