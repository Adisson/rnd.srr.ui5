sap.ui.define([
    "./Base",
    "sap/ui/core/Fragment",
    "sap/m/Token",
    "../service/solicitud",
    "../util/validacion"
],
    /**
     * @param {typeof Base} Controller
     * @param {typeof sap.ui.core.Fragment} Fragment
     * @param {typeof sap.m.Token} Token
     */
    function (Controller, Fragment, Token, Solicitud, Validacion) {
        "use strict";

        return Controller.extend("rnd.srr.ui5.controller.View", {
            onLogin: async function(){
                const sPath = jQuery.sap.getModulePath("rnd.srr.ui5")
                let sSession = ""
                await $.ajax({
                    type: "GET",
                    url: sPath + "/b1-login-fertisur/",
                    success: function (response) {
                        sSession = response.SessionId
                    }
                });
                document.cookie = "B1SESSION=" + sSession
            },
            onAfterRendering: async function () {
                await this.onLogin();
                this.init();
                Solicitud.init(this.oLocalModel);

                var oDocumento = {
                    fechaSistema: new Date()
                }
                this.oLocalModel.setProperty("/documento", oDocumento);

                await this.cargarListados();
            },     
            cargarListados: async function(){
                sap.ui.core.BusyIndicator.show();
                await Solicitud.obtenerTipoSolicitud();
                await Solicitud.obtenerDepartamento();
                await Solicitud.obtenerMedioPago();
                await Solicitud.obtenerMoneda();
                await Solicitud.obtenerSolicitantes();

                var userInfo = sap.ushell.Container.getService("UserInfo");
                var email = userInfo.getEmail();

                await Solicitud.obtenerRendiciones(email);

                this._cargarSolicitante();    
                
                sap.ui.core.BusyIndicator.hide();
            },
            _cargarSolicitante: function(){
                this.byId('multiInput').destroyTokens();

                var userInfo = sap.ushell.Container.getService("UserInfo");
                var email = userInfo.getEmail();
                
                var aListadoSolicitante = this.oLocalModel.getProperty("/listadoSolicitante");
                var oSolicitante = aListadoSolicitante.find(d => d.E_Mail == email);

                if (oSolicitante){
                    this.byId("multiInput").addToken(new sap.m.Token({key:oSolicitante.CardCode, text:oSolicitante.CardCode}))
                
                    this.oLocalModel.setProperty("/documento/nombreSolicitante", oSolicitante.CardName);
                    this.oLocalModel.setProperty("/documento/docType", oSolicitante.CardType);
                }
            },
            onInit: function () {
                this.oLocalModel = this.getOwnerComponent().getModel("localModel");
            },
            onCrearDocumento: async function(){
                try {
                    var oData = this.oLocalModel.getProperty("/documento");

                    var bRequerido = Validacion.validarDocumento(this.oLocalModel, this.getResourceBundle());

                    if (bRequerido) return;

                    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "yyyy-MM-dd" });   
                    var sDocDate = dateFormat.format(oData.fechaSistema);
                    var sTaxDate = dateFormat.format(oData.fechaDocumento);
                    var sDueDate = dateFormat.format(oData.fechaPropuesta);

                    var aTokens = this.getView().byId("multiInput").getTokens();
                    var aCardCode = aTokens.map(function(oToken) {
                        return oToken.getKey();
                    });

                    var aTokensR = this.getView().byId("multiInputRendicion").getTokens();
                    var aRendiciones = aTokensR.map(function(oToken) {
                        return oToken.getKey();
                    });

                    
    
                    var oDocumento = {};
                    
                    oDocumento.DocType = 'rCustomer'//oData.docType == 'C' ? 'rCustomer' : oData.docType == 'S' ? 'cSupplier' : '';
                    oDocumento.DocDate = sDocDate;
                    oDocumento.U_UPP_NROREN = aRendiciones[0];
                    oDocumento.CardCode = aCardCode[0];
                    oDocumento.DocCurrency = oData.moneda;
                    oDocumento.ControlAccount = "141301";
                    if (oData.medioPago == "1"){
                        oDocumento.TransferAccount = "104103";
                        oDocumento.TransferDate = sDocDate;
                        oDocumento.TransferSum = oData.monto;
                    }else{
                        oDocumento.CashAccount = "103101";
                        oDocumento.CashSum = oData.monto;
                    }
                    
                    var userInfo = sap.ushell.Container.getService("UserInfo");
                    var email = userInfo.getEmail();

                    oDocumento.U_UPP_TPOOPER = "ER02";
                    oDocumento.DocObjectCode = "bopot_OutgoingPayments";
                    oDocumento.TaxDate = sTaxDate;
                    oDocumento.DueDate = sDueDate;
                    oDocumento.JournalRemarks = oData.comentarios;
                    oDocumento.U_UPP_DESREN = oData.descripcionRendicion;
                    oDocumento.U_UPP_DEP = oData.departamento;
                    oDocumento.U_UPP_TIPSOL = oData.tipoSolicitud;
                    oDocumento.U_UPP_ESTADO = "P";
                    oDocumento.U_UPP_RECHAZADO = null;
                    oDocumento.U_UPP_USUARIO = email.split('@')[0];

                    await Solicitud.crearDocumento(oDocumento);
                    
                    sap.m.MessageBox.success(this.getResourceBundle().getText('msgDocumentoCreado'));
                    var oDocumento = {
                        fechaSistema: new Date()
                    }
                    this.oLocalModel.setProperty("/documento", oDocumento);

                    this.byId('multiInput').destroyTokens();

                } catch (error) {
                    sap.m.MessageBox.success(this.getResourceBundle().getText('msgDocumentoCreado'));
                }
            },
            onChangeMonto: function(e){
                var sMonto = e.getSource().getValue();
                e.getSource().setValue(parseFloat(sMonto).toFixed(2))
            },
            onCancelar: function(){
                var that = this;
                sap.m.MessageBox.confirm(this.getResourceBundle().getText('msgConfirmCancelar'), {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function(oAction) {
                        if (oAction === sap.m.MessageBox.Action.YES) {
                            var fecha = new Date();
                            var oDocumento = {
                                fechaSistema: fecha,
                                anioActual: new Date(fecha.getFullYear(), 1,1)
                            }
                            that.oLocalModel.setProperty("/documento", oDocumento);

                            that._cargarSolicitante();
                        }
                    }
                });
            }
        });
    });
