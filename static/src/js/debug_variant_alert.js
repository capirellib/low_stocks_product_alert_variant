/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";

console.log("🔥 [low_stocks_product_alert_variant] debug_variant_alert.js cargado");

// Debug ACTIVO para verificar
patch(ProductCard.prototype, {
    setup() {
        super.setup(...arguments);
        const product = this.props.product;
        
        // Debug: Mostrar información del producto solo si tiene alert_tag
        if (product.alert_tag) {
            console.log("🐛 [Alert Debug] Producto CON ALERTA:", {
                id: product.id,
                name: product.display_name || product.name,
                alert_tag: product.alert_tag,
                qty_available: product.qty_available,
                is_storable: product.is_storable || product.type === 'product',
            });
        }
    }
});
