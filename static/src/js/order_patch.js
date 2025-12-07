/** @odoo-module **/

import { Orderline } from "@point_of_sale/app/generic_components/orderline/orderline";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";
import { onMounted } from "@odoo/owl";

console.log("🔥 [low_stocks_product_alert_variant] order_patch.js cargado");

const CART_STORAGE_KEY = 'pos_variant_cart_quantities';

// Actualizar localStorage con todas las cantidades del carrito
function updateCartStorage(pos) {
    if (!pos) return;
    
    const order = pos.get_order();
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

patch(Orderline.prototype, {
    setup() {
        super.setup(...arguments);
        this.pos = useService("pos");
        
        // Actualizar cuando se monta una nueva línea
        onMounted(() => {
            console.log('➕ [Orderline] Nueva línea montada');
            updateCartStorage(this.pos);
        });
    },
});

console.log("✅ [low_stocks_product_alert_variant] Orderline patch aplicado");
