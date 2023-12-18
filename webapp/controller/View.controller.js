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
            U_UPP_NROREN: "31",
            U_UPP_DESREN: "32",
            U_UPP_DEP: "33",
            U_UPP_TIPSOL: "34",
            U_UPP_USUARIO: "35",
            U_UPP_ESTADO: "36",
            U_UPP_RECHAZADO: "37",
            U_UPP_TPOOPER: "30",
            U_UPP_ERSTATUS: "38",

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
                
                await Solicitud.obtenerUsuario();

                var oUsuario = this.oLocalModel.getProperty("/usuario");

                await Solicitud.obtenerRendiciones(oUsuario.login_name.length ? oUsuario.login_name[0] : '');

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
                    sap.ui.core.BusyIndicator.show();

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
                    oDocumento.CardCode = aCardCode[0];
                    oDocumento.DocCurrency = oData.moneda;
                    
                    await Solicitud.obtenerParametrizacion('03');
                    
                    var oParamNroRen = Solicitud.obtenerParametrizacionCode(this.U_UPP_NROREN);
                    var oParamDesRen = Solicitud.obtenerParametrizacionCode(this.U_UPP_DESREN);
                    var oParamDep = Solicitud.obtenerParametrizacionCode(this.U_UPP_DEP);
                    var oParamTipoSol = Solicitud.obtenerParametrizacionCode(this.U_UPP_TIPSOL);
                    var oParamUsuario = Solicitud.obtenerParametrizacionCode(this.U_UPP_USUARIO);
                    var oParamEstado = Solicitud.obtenerParametrizacionCode(this.U_UPP_ESTADO);
                    var oParamRechazado = Solicitud.obtenerParametrizacionCode(this.U_UPP_RECHAZADO);
                    var oParamCuenta = Solicitud.obtenerParametrizacionCode(this.U_UPP_TPOOPER);
                    var oParamStatus = Solicitud.obtenerParametrizacionCode(this.U_UPP_ERSTATUS);

                    var oCuenta = await Solicitud.obtenerCuenta(oParamCuenta.U_UPP_VALORO);
                    oDocumento.ControlAccount = oCuenta ? oCuenta.U_UPP_CUENTA : '141301';

                    var oCuentaTransf = await Solicitud.obtenerCuenta('TR01');
                    var oCuentaCash = await Solicitud.obtenerCuenta('TR02');
                    if (oData.medioPago == "1"){
                        oDocumento.TransferAccount = oCuentaTransf ? oCuentaTransf.U_UPP_CUENTA : '104103';
                        oDocumento.TransferDate = sDocDate;
                        oDocumento.TransferSum = oData.monto;
                    }else{
                        oDocumento.CashAccount = oCuentaCash ? oCuentaCash.U_UPP_CUENTA : '103101';
                        oDocumento.CashSum = oData.monto;
                    }
                    
                    var oUsuario = this.oModel.getProperty("/usuario");
                    
                    oDocumento.DocObjectCode = oParamCuenta.U_UPP_OBJETOP;
                    oDocumento.TaxDate = sTaxDate;
                    oDocumento.DueDate = sDueDate;
                    oDocumento.JournalRemarks = oData.comentarios;

                    oDocumento[oParamNroRen.U_UPP_ATRIBUTO] = aRendiciones[0];
                    oDocumento[oParamCuenta.U_UPP_ATRIBUTO] = oCuenta ? oCuenta.Code : 'ER02';
                    oDocumento[oParamDesRen.U_UPP_ATRIBUTO] = oData.descripcionRendicion;
                    oDocumento[oParamDep.U_UPP_ATRIBUTO] = oData.departamento;
                    oDocumento[oParamTipoSol.U_UPP_ATRIBUTO] = oData.tipoSolicitud;
                    oDocumento[oParamEstado.U_UPP_ATRIBUTO] = oParamEstado.U_UPP_VALORD;
                    oDocumento[oParamRechazado.U_UPP_ATRIBUTO] = null;
                    oDocumento[oParamUsuario.U_UPP_ATRIBUTO] = oUsuario.login_name.length ? oUsuario.login_name[0] : '';
                    oDocumento[oParamStatus.U_UPP_ATRIBUTO] = oParamStatus.U_UPP_VALORD;

                    await Solicitud.crearDocumento(oDocumento);
                    
                    sap.m.MessageBox.success(this.getResourceBundle().getText('msgDocumentoCreado'));
                    var oDocumento = {
                        fechaSistema: new Date()
                    }
                    this.oLocalModel.setProperty("/documento", oDocumento);

                    this.byId('multiInput').destroyTokens();

                    sap.ui.core.BusyIndicator.hide();

                } catch (error) {
                    if (error.responseJSON){
                        sap.m.MessageBox.error(error.responseJSON.error.message);
                    }else{
                        sap.m.MessageBox.error(this.getResourceBundle().getText('ocurrioError'));
                    }

                    sap.ui.core.BusyIndicator.hide();
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
                            that._IrListado();
                        }
                    }
                });
            },

            _IrListado: function () {
                var oCrossAppNavigator = sap.ushell.Container.getService('CrossApplicationNavigation');
                var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: 'rndlrui5',
                        action: 'display'
                    }
                })) || '';
                sap.m.URLHelper.redirect(window.location.href.split('#')[0] + hash, false);
            },
        });
    });
