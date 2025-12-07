/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";

console.log("🔥 [low_stocks_product_alert_variant] debug_variant_alert.js cargado");

// Debug ACTIVO para verificar TODOS los productos
patch(ProductCard.prototype, {
    setup() {
        super.setup(...arguments);
        const product = this.props.product;
        
        // Debug: Mostrar TODOS los productos con información de stock
        console.log("🐛 [Product Debug]", {
            id: product.id,
            name: product.display_name || product.name,
            alert_tag: product.alert_tag,
            qty_available: product.qty_available,
            is_storable: product.is_storable || product.type === 'product',
            hasAlert: product.alert_tag && product.alert_tag !== false
        });
    }
});
