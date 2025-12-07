/** @odoo-module **/

import { PosStore } from "@point_of_sale/app/services/pos_store";
import { patch } from "@web/core/utils/patch";

console.log("🔥 [low_stocks_product_alert_variant] order_patch.js cargado");

const CART_STORAGE_KEY = 'pos_variant_cart_quantities';

// Actualizar localStorage con cantidades del carrito
function updateCartStorage(order) {
    if (!order || !order.lines) {
        return;
    }
    
    const quantities = {};
    for (const line of order.lines) {
        const productId = line.product_id?.id || line.product_id;
        if (productId) {
            quantities[productId] = (quantities[productId] || 0) + (line.qty || 0);
        }
    }
    
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(quantities));
        window.dispatchEvent(new CustomEvent('pos_cart_updated', { detail: quantities }));
        console.log('✅ [Cart Storage] Actualizado:', quantities);
    } catch (e) {
        console.error('Error guardando carrito:', e);
    }
}

patch(PosStore.prototype, {
    // Cuando se agrega una línea al pedido
    async addLineToCurrentOrder(vals, opts) {
        const result = await super.addLineToCurrentOrder(...arguments);
        console.log('➕ [Order Patch] Línea agregada al pedido');
        const order = this.get_order();
        if (order) {
            updateCartStorage(order);
        }
        return result;
    },
    
    // Cuando se cambia la cantidad de una línea
    async setQuantityLineToCurrentOrder(line, quantity) {
        const result = await super.setQuantityLineToCurrentOrder?.(...arguments);
        console.log('🔢 [Order Patch] Cantidad cambiada');
        const order = this.get_order();
        if (order) {
            updateCartStorage(order);
        }
        return result;
    },
});

console.log("✅ [low_stocks_product_alert_variant] PosStore patch aplicado");
