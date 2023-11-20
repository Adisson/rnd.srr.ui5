sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",	
	"sap/ui/model/FilterOperator"
], function (Controller, UIComponent, JSONModel, MessageToast, MessageBox, Fragment, Filter, FilterOperator) {
	"use strict";
	return Controller.extend("rnd.srr.ui5.controller.Base", {
		
		init: async function(){
			this.oLocalModel = this.getOwnerComponent().getModel("localModel");
			this.o18nModel = this.getOwnerComponent().getModel("i18n");
		},
		onValueHelpConfirm : function (oEvent){
            const that = this;

			var oLocalModel = this.getOwnerComponent().getModel("localModel");
            var oValueHelpModel = this.getModel("ValueHelpModel").getData();
            var sModelName = "localModel";

			var context = oValueHelpModel.oValueHelpInput.getBindingContext(sModelName);

			oValueHelpModel.oValueHelpInput.destroyTokens();
            if (oValueHelpModel.oValueHelpInput.getTokens){
                const aSelectedContexts = oEvent.getParameter("selectedContexts");
                aSelectedContexts.forEach(function(item){
                    const obj = item.getObject();
                    oValueHelpModel.oValueHelpInput.addToken(new sap.m.Token({key:obj[oValueHelpModel.key], text:obj[oValueHelpModel.key]}))
					
					if (oValueHelpModel.path){
						oLocalModel.setProperty(oValueHelpModel.path, obj[oValueHelpModel.des]);
					}

					if (oValueHelpModel.path2){
						oLocalModel.setProperty(oValueHelpModel.path2, obj[oValueHelpModel.des2]);
					}
                })
            }else{
                var selectedValue = oEvent.getParameter("selectedItem").getBindingContext(sModelName).getProperty(oValueHelpModel.key);
                context.setProperty(oValueHelpModel.path, selectedValue);
                
                var descripcion = oEvent.getParameter("selectedItem").getDescription();
                oValueHelpModel.oValueHelpInput.setValue(descripcion);
            }
		},
		onValueHelpSearch: function (oEvent){
			var sValue = oEvent.getParameter("value");
            var oValueHelpModel = this.getModel("ValueHelpModel").getData();

			var aFilter = [];
            aFilter.push(new Filter(oValueHelpModel.search, FilterOperator.Contains, sValue));
            aFilter.push(new Filter(oValueHelpModel.key, FilterOperator.Contains, sValue));
            aFilter = new Filter({filters: aFilter, and: false})
            var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilter);
		},
		onValueHelpClose : function (oEvent){
			oEvent.getSource().getBinding("items").filter([]);
		},
		onValueHelpOpen : function (oEvent) {
			var oValueHelpModel = {};
            oValueHelpModel.oValueHelpInput = oEvent.getSource();
			
			var path = oEvent.getSource().data("path");
			var path2 = oEvent.getSource().data("path2");
			
			var dialog = oEvent.getSource().data("dialog");
			
			var that = this;
			this.openDialog(dialog, function(oDialog){
				var sSearch = oDialog.data("search");
				var sKey = oDialog.data("key");
                var sToken = oDialog.data("token");
				var sDes = oDialog.data("des");
				var sDes2 = oDialog.data("des2");
				
                oValueHelpModel.path = path;
				oValueHelpModel.path2 = path2;
				
				oValueHelpModel.search = sSearch;
				oValueHelpModel.key = sKey;
				oValueHelpModel.token = sToken;
				oValueHelpModel.des = sDes;
				oValueHelpModel.des2 = sDes2;
				
				
                that.setModel(new JSONModel(oValueHelpModel), "ValueHelpModel");

                var oBinding = oDialog.getBinding("items");
                oBinding.filter(null);
			});
		},
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},
		// just this.getModel() ...
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		MessageToast: function (Text) {
			MessageToast.show(Text);
		},
		// fragment manipulation
		_fragments: {},
		openDialog: async function(sFragmentName, sOpenCallback) {
			var that = this;
			var _oFragment = this._fragments[sFragmentName];
			
			debugger
			const componentName = this.getOwnerComponent().getMetadata().getComponentName();
			const oController = sap.ui.controller(componentName + ".controller.fragment." + sFragmentName);

			if (_oFragment !== undefined) {
                _oFragment.open();
                sOpenCallback(_oFragment);
				oController.onAfterRendering();
			} else {
				const oFragment = await Fragment.load({
					id: this.getView().getId(),
					name: componentName + ".view.fragment." + sFragmentName,
					controller: oController
				})
                oController.oView = this.getView();
				oController.init();
				oController.onAfterRendering();

                that._fragments[sFragmentName] = oFragment;
                that.getView().addDependent(oFragment);

				if (["CreateUser", "Login"].includes(sFragmentName)){
					oFragment.setEscapeHandler((oEscapeHandler) => {
						oEscapeHandler.reject();
					});
				}

                oFragment.open();
                sOpenCallback(oFragment);
			}
		},
		closeDialog: function(sFragmentName){
			var oFragment = this._fragments[sFragmentName];
			oFragment.close();
		},
		loadFragment: function (sFragmentName, sContainer) {
			var that = this;
			var oFragment = this._fragments[sFragmentName];
			var	oContainer = this.getView().byId(sContainer);
			
			if (oFragment !== undefined) {
				oContainer.removeAllItems();
				oContainer.insertItem(oFragment);
			} else {
				Fragment.load({
					name: "zns_PcvInc.zhrwa_PcvInc.view." + sFragmentName
				}).then(function(sFragment) {
					that._fragments[sFragmentName] = sFragment;
					oContainer.removeAllItems();
					oContainer.insertItem(sFragment);					
				});		
			}
		}         

	});

});