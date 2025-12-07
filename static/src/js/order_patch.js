/** @odoo-module **/

import { Order } from "@point_of_sale/app/store/models";
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

patch(Order.prototype, {
    setup() {
        super.setup(...arguments);
        console.log('🔧 [Order Patch] Setup ejecutado');
    },
    
    add_orderline(line) {
        const result = super.add_orderline(...arguments);
        console.log('➕ [Order Patch] Línea agregada');
        updateCartStorage(this);
        return result;
    },
    
    remove_orderline(line) {
        const result = super.remove_orderline(...arguments);
        console.log('➖ [Order Patch] Línea removida');
        updateCartStorage(this);
        return result;
    },
    
    set_quantity(line, quantity) {
        const result = super.set_quantity?.(...arguments);
        console.log('🔢 [Order Patch] Cantidad cambiada');
        updateCartStorage(this);
        return result;
    },
    
    // Cuando se finaliza/valida el pedido, limpiar el carrito
    export_for_printing() {
        const result = super.export_for_printing(...arguments);
        console.log('📋 [Order Patch] Pedido exportado para impresión');
        // Limpiar localStorage cuando se valida el pedido
        setTimeout(() => {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({}));
            window.dispatchEvent(new CustomEvent('pos_cart_updated', { detail: {} }));
            console.log('🧹 [Cart Storage] Limpiado después de validación');
        }, 1000);
        return result;
    },
});

console.log("✅ [low_stocks_product_alert_variant] Order patch aplicado");
