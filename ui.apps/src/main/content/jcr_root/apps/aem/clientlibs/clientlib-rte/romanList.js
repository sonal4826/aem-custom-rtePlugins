(function ($) {
    "use strict";

    var GROUP = "roman-List",
        ROMAN_LIST_FEATURE = "romanList",
        ORDERED_LIST_CMD = "insertorderedlist",
        CUI = window.CUI;

    addPluginToDefaultUISettings();

    var RomanListCmd = new Class({
        extend: CUI.rte.commands.List,

        toString: "RomanListCmd",
		
		createListFromSelection: function (execDef, listType) {
      var nodeList = execDef.nodeList;
      var context = execDef.editContext;
      // todo distinguish between entire cell and parts of a cell
      var blockLists = nodeList.getEditBlocksByAuxRoots(context, true);
      var listCnt = blockLists.length;
      for (var l = 0; l < listCnt; l++) {
        this.createList(context, blockLists[l], listType);
      }
    },
	
	createList: function (context, blockList, listType) {
        var lut = CUI.rte.ListUtils;
		var com = CUI.rte.Common;
		var dpr = CUI.rte.DomProcessor;
        // preprocess if a table cell is reported as the only edit block
        if ((blockList.length === 1) && com.isTag(blockList[0], com.TABLE_CELLS)) {
          var tempBlock = context.createElement('div');
          com.moveChildren(blockList[0], tempBlock);
          blockList[0].appendChild(tempBlock);
          blockList[0] = tempBlock;
        }
        // simplify block list by using lists instead of their respective list items
        var blockCnt = blockList.length;
        for (var b = 0; b < blockCnt; b++) {
          if (com.isTag(blockList[b], 'li')) {
            var listNode = blockList[b].parentNode;
            blockList[b] = listNode;
            for (var b1 = 0; b1 < b; b1++) {
              if (blockList[b1] === listNode) {
                blockList[b] = null;
                break;
              }
            }
          }
        }
        // common list creation
        var listDom = context.createElement(listType);
		listDom.setAttribute('type', 'i');
        com.addInlineStyles(listDom, {'list-style-position': 'inside'});
        blockCnt = blockList.length;
        for (b = 0; b < blockCnt; b++) {
          var blockToProcess = blockList[b];
          if (blockToProcess) {
            var mustRecurse = com.isTag(blockToProcess, dpr.AUXILIARY_ROOT_TAGS);
            if (!mustRecurse) {
              if (listDom.childNodes.length === 0) {
                // first, insert the list
                blockToProcess.parentNode.insertBefore(listDom, blockToProcess);
              }
              if (!com.isTag(blockToProcess, com.LIST_TAGS)) {
                // normal blocks
                var listItemDom = context.createElement('li');
                listDom.appendChild(listItemDom);
                com.moveChildren(blockToProcess, listItemDom, 0, true);
                blockToProcess.parentNode.removeChild(blockToProcess);
              } else {
                // pre-existing list
                com.moveChildren(blockToProcess, listDom, 0, true);
                blockToProcess.parentNode.removeChild(blockToProcess);
              }
            } else {
              // create list recursively
              var subBlocks = [];
              var sbCnt = blockToProcess.childNodes.length;
              for (var c = 0; c < sbCnt; c++) {
                var subBlock = blockToProcess.childNodes[c];
                if (com.isTag(subBlock, com.EDITBLOCK_TAGS)) {
                  subBlocks.push(subBlock);
                }
              }
              if (subBlocks.length === 0) {
                subBlocks.push(blockToProcess);
              }
              lut.createList(context, subBlocks, listType);
              // start a new list if a non-listable tag has been encountered
              listDom = context.createElement(listType);
              com.addInlineStyles(listDom, {'list-style-position': 'inside'});
            }
          }
        }
        // check if we can join adjacent lists
        var prevSib = listDom.previousSibling;
        if (prevSib && com.isTag(prevSib, listType)) {
          com.moveChildren(listDom, prevSib, 0, true);
          listDom.parentNode.removeChild(listDom);
          listDom = prevSib;
        }
        var nextSib = listDom.nextSibling;
        if (nextSib && com.isTag(nextSib, listType)) {
          com.moveChildren(nextSib, listDom, 0, true);
          nextSib.parentNode.removeChild(nextSib);
        }
      },

        execute: function(execDef) {
			this.superClass.execute.call(this, execDef);
			var com = CUI.rte.Common;
            var context = execDef.editContext;
            var nodeList = execDef.nodeList;
			var command = execDef.command;
			var value = execDef.value;
			var listType = 'ol';
			if (listType) {
              var listItems;
              var refList = this.getDefiningListDom(context, nodeList);
              if (refList === null || refList === undefined) {
                  // creating new list (and joining existing lists)
                  this.createListFromSelection(execDef, listType);
              } else if (!com.isTag(refList, listType)) {
                  // change list type of selected items (or entire list)
                  listItems = this.getListItems(execDef);
                  this.changeItemsListType(execDef, listItems, listType);
              } else {
                  // unlist all items of lead list
                 listItems = this.getAllListItems(execDef);
                 if (listItems.length > 0) {
                     var itemsByList = this.splitToTopLevelLists(execDef, listItems);
                     var listCnt = itemsByList.length;
                    for (var l = 0; l < listCnt; l++) {
                        listItems = itemsByList[l];
                        this.unlistItems(execDef, listItems, value === true);
                    }
                }
              }
            }
        }
    });

    CUI.rte.commands.CommandRegistry.register(ORDERED_LIST_CMD, RomanListCmd);

    var RomanListPlugin = new Class({
        toString: "RomanListPlugin",

        extend: CUI.rte.plugins.Plugin,

        pickerUI: null,

        getFeatures: function () {
            return [ROMAN_LIST_FEATURE];
        },

        initializeUI: function(tbGenerator) {
            var plg = CUI.rte.plugins;

            if (!this.isFeatureEnabled(ROMAN_LIST_FEATURE)) {
                return;
            }

            this.pickerUI = tbGenerator.createElement(ROMAN_LIST_FEATURE, this, false, { title: "Roman list..." });
            tbGenerator.addElement(GROUP, plg.Plugin.SORT_FORMAT, this.pickerUI, 10);

            var groupFeature = GROUP + "#" + ROMAN_LIST_FEATURE;
            tbGenerator.registerIcon(groupFeature, "textRomanLowercase");
        },

        execute: function (id, value, envOptions) {
            if (!isValidSelection()) {
                return;
            }

            this.editorKernel.relayCmd(ORDERED_LIST_CMD);

            function isValidSelection(){
                var winSel = window.getSelection();
                return winSel && (winSel.rangeCount == 1) && (winSel.getRangeAt(0).toString().length > 0);
            }
        },

        updateState: function(selDef) {
            var hasUC = this.editorKernel.queryState(ROMAN_LIST_FEATURE, selDef);

            if (this.pickerUI != null) {
                this.pickerUI.setSelected(hasUC);
            }
        }
    });

    function addPluginToDefaultUISettings(){
		
		var groupFeature = GROUP + "#" + ROMAN_LIST_FEATURE,
            toolbar = CUI.rte.ui.cui.DEFAULT_UI_SETTINGS.fullscreen.toolbar;

        if(toolbar.includes(groupFeature)){
            return;
        }

        toolbar.splice(7, 0, groupFeature);
    }

    CUI.rte.plugins.PluginRegistry.register(GROUP,RomanListPlugin);
})(jQuery);