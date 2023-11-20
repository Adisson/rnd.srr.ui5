sap.ui.define([
], function(
) {
	"use strict";

    return {
        init: function(oLocalModel, i18n){
            this.oLocalModel = oLocalModel;
            this.i18n = i18n;
        },
        obtenerTipoSolicitud: async function(){
            const sPath = jQuery.sap.getModulePath("rnd.srr.ui5")
            await $.ajax( {
                type : "GET",
                url : sPath + "/b1-sl-fertisur/UPP_TIPOSOL",
                success : function(data){
                    this.oLocalModel.setProperty("/listadoTipoSolicitud", data.value);
                }.bind(this)
            });
            
            /*var aTipoSolicitud = [
                {Code: '01',Name: 'Viatico'},
                {Code: '02',Name: 'Recibo provisional'},
                {Code: '03',Name: 'Gasto urgente'},
                {Code: '04',Name: 'Orden de viaje'}
            ]*/
            
        },

        obtenerDepartamento: async function(){
            const sPath = jQuery.sap.getModulePath("rnd.srr.ui5")
            await $.ajax( {
                type : "GET",
                url : sPath + "/b1-sl-fertisur/UPP_DEPART",
                success : function(data){
                    this.oLocalModel.setProperty("/listadoDepartamento", data.value);
                }.bind(this)
            });
            /*var aDepartamento = [
                {Code: '01',Name: 'General'},
                {Code: '02',Name: 'Logistica'},
                {Code: '03',Name: 'RRHH'},
                {Code: '04',Name: 'Ventas'}
            ]*/
            
        },

        obtenerMedioPago: async function(){
            var aMedioPago = [
                {Code: '1',Name: 'Tranferencia'},
                {Code: '2',Name: 'Efectivo'}
            ]
            this.oLocalModel.setProperty("/listadoMedioPago", aMedioPago);
        },

        obtenerMoneda: async function(){
            const sPath = jQuery.sap.getModulePath("rnd.srr.ui5")
            await $.ajax( {
                type : "GET",
                url : sPath + "/b1-sl-fertisur/Currencies",
                success : function(data){
                    this.oLocalModel.setProperty("/listadoMoneda", data.value);
                }.bind(this)
            });
            /*var aMoneda = [
                {Code: '01',Name: 'SOL - SOLES'},
                {Code: '02',Name: 'DOL - DOLARES'},
                {Code: '03',Name: 'EUR - EUROS'}
            ]*/
            
        },

        obtenerSolicitantes: async function(){
            const sPath = jQuery.sap.getModulePath("rnd.srr.ui5")
            await $.ajax( {
                type : "GET",
                url : sPath + "/b1-sl-fertisur/SQLQueries('sql21')/List",
                success : function(data){
                    this.oLocalModel.setProperty("/listadoSolicitante", data.value);
                }.bind(this)
            });
            /*var aMoneda = [
                {Code: '01',Name: 'SOL - SOLES'},
                {Code: '02',Name: 'DOL - DOLARES'},
                {Code: '03',Name: 'EUR - EUROS'}
            ]*/
            
        },

        obtenerRendiciones: async function(usuario){
            const sPath = jQuery.sap.getModulePath("rnd.srr.ui5")
            await $.ajax( {
                type : "GET",
                url : sPath + "/b1-sl-fertisur/SQLQueries('sql13')/List",
                success : function(data){
                    var aRendiciones = data.value;
                    aRendiciones = aRendiciones.filter(d => d.U_UPP_USUARIO == usuario);
                    
                    this.oLocalModel.setProperty("/listadoRendiciones", aRendiciones);
                }.bind(this)
            });
            /*var aMoneda = [
                {Code: '01',Name: 'SOL - SOLES'},
                {Code: '02',Name: 'DOL - DOLARES'},
                {Code: '03',Name: 'EUR - EUROS'}
            ]*/
            
        },
        
        crearDocumento: async function(oDocumento){
            const sPath = jQuery.sap.getModulePath("rnd.srr.ui5")
            await $.ajax( {
                type : "POST",
                url : sPath + "/b1-sl-fertisur/PaymentDrafts",
                data: JSON.stringify(oDocumento),
                success : function(data){
                    console.log(data)
                }.bind(this)
            });
            /*var aMoneda = [
                {Code: '01',Name: 'SOL - SOLES'},
                {Code: '02',Name: 'DOL - DOLARES'},
                {Code: '03',Name: 'EUR - EUROS'}
            ]*/
            
        }
    }
});