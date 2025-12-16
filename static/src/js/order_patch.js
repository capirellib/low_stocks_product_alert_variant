/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { PosStore } from "@point_of_sale/app/store/pos_store";

console.log("🛒 [Stock Alert] order_patch.js cargando...");

// Estado global para rastrear el carrito
let lastCartState = null;
let cartMonitorInterval = null;

// Función para obtener el estado actual del carrito
function getCartState(pos) {
    try {
        const order = pos?.get_order?.();
        if (!order) return null;
        
        const lines = order.get_orderlines?.() || [];
        return lines.map(line => ({
            id: line.product?.id || line.product_id,
            qty: line.get_quantity?.() || line.quantity || line.qty || 0
        }));
    } catch (error) {
        return null;
    }
}

// Función para comparar estados del carrito
function hasCartChanged(oldState, newState) {
    if (!oldState && newState) return true;
    if (oldState && !newState) return true;
    if (!oldState && !newState) return false;
    
    if (oldState.length !== newState.length) return true;
    
    for (let i = 0; i < newState.length; i++) {
        const oldLine = oldState.find(l => l.id === newState[i].id);
        if (!oldLine || oldLine.qty !== newState[i].qty) {
            return true;
        }
    }
    
    return false;
}

// Función para disparar actualización
function triggerCartUpdate() {
    const event = new CustomEvent('pos_cart_updated', {
        detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(event);
    console.log("🔔 [Stock Alert] Evento pos_cart_updated disparado");
}

// Monitor activo del carrito
function startCartMonitor(pos) {
    if (cartMonitorInterval) {
        clearInterval(cartMonitorInterval);
    }
    
    console.log("👀 [Stock Alert] Monitor de carrito iniciado");
    
    cartMonitorInterval = setInterval(() => {
        const currentState = getCartState(pos);
        
        if (hasCartChanged(lastCartState, currentState)) {
            console.log("🔍 [Stock Alert] Cambio detectado en el carrito");
            lastCartState = currentState;
            triggerCartUpdate();
        }
    }, 500); // Verificar cada 500ms
}

// Patchear PosStore
patch(PosStore.prototype, {
    async setup() {
        await super.setup(...arguments);
        
        // Iniciar monitor después de que el POS esté listo
        setTimeout(() => {
            startCartMonitor(this);
        }, 1000);
    },
    
    async addProductToCurrentOrder(product, options = {}) {
        console.log("🛒 [Stock Alert] PosStore.addProductToCurrentOrder - Producto:", product?.display_name || product?.name);
        
        const result = await super.addProductToCurrentOrder(product, options);
        
        // Forzar actualización inmediata
        setTimeout(() => {
            lastCartState = getCartState(this);
            triggerCartUpdate();
        }, 100);
        
        return result;
    },
    
    async removeOrderline(orderline) {
        console.log("🛒 [Stock Alert] PosStore.removeOrderline");
        
        const result = await super.removeOrderline?.(orderline);
        
        // Forzar actualización inmediata
        setTimeout(() => {
            lastCartState = getCartState(this);
            triggerCartUpdate();
        }, 100);
        
        return result;
    }
});

console.log("✅ [Stock Alert] PosStore patch aplicado correctamente");
