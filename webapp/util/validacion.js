sap.ui.define([
], function(
) {
	"use strict";

	return {
        validarDocumento: function(model, i18n){
            var oData = model.getProperty("/documento");
            var oModelValueState = {};
            var bRequerido = false;

            if (!oData.tipoSolicitud){
                oModelValueState.tipoSolicitudVs = "Error";
                oModelValueState.tipoSolicitudVst = i18n.getText("requerido");
                bRequerido = true;
            }

            if (!oData.nombreSolicitante){
                oModelValueState.solicitanteVs = "Error";
                oModelValueState.solicitanteVst = i18n.getText("requerido");
                bRequerido = true;
            }

            if (!oData.departamento){
                oModelValueState.departamentoVs = "Error";
                oModelValueState.departamentoVst = i18n.getText("requerido");
                bRequerido = true;
            }

            if (!oData.medioPago){
                oModelValueState.medioPagoVs = "Error";
                oModelValueState.medioPagoVst = i18n.getText("requerido");
                bRequerido = true;
            }

            if (!oData.moneda){
                oModelValueState.monedaVs = "Error";
                oModelValueState.monedaVst = i18n.getText("requerido");
                bRequerido = true;
            }

            if (!oData.monto){
                oModelValueState.montoVs = "Error";
                oModelValueState.montoVst = i18n.getText("requerido");
                bRequerido = true;
            }

            if (!oData.fechaDocumento){
                oModelValueState.fechaDocumentoVs = "Error";
                oModelValueState.fechaDocumentoVst = i18n.getText("requerido");
                bRequerido = true;
            }

            if (!oData.fechaPropuesta){
                oModelValueState.fechaPropuestaVs = "Error";
                oModelValueState.fechaPropuestaVst = i18n.getText("requerido");
                bRequerido = true;
            }

            model.setProperty("/ValueState", oModelValueState);

            return bRequerido;
        }
	};
});