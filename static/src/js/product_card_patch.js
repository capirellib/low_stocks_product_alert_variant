/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { onPatched } from "@odoo/owl";

console.log("🔥 [low_stocks_product_alert_variant] product_card_patch.js cargado");

patch(ProductCard.prototype, {
    setup() {
        super.setup(...arguments);
        
        onPatched(() => {
            this.addAlertBadge();
        });
    },
    
    addAlertBadge() {
        const product = this.props.product;
        
        // Mostrar badge si tiene alert_tag O siempre mostrar cantidad de stock
        if (product.alert_tag && product.alert_tag !== false) {
            const imgContainer = this.el?.querySelector('.product-img');
            
            if (imgContainer && !imgContainer.querySelector('.alert_tag')) {
                const badge = document.createElement('span');
                badge.className = 'alert_tag position-absolute top-0 start-0 translate-middle';
                badge.style.cssText = 'background-color: #a1dafc; margin-left: 20%; margin-top: 9%; padding: 1px 10px; border-radius: 5px; z-index: 10;';
                
                const icon = document.createElement('i');
                icon.className = 'fa fa-warning text-danger';
                icon.style.paddingRight = '5px';
                
                badge.appendChild(icon);
                badge.appendChild(document.createTextNode(product.alert_tag));
                
                imgContainer.appendChild(badge);
                
                console.log("✅ [Alert] Badge agregado a:", product.display_name || product.name, "Stock:", product.qty_available);
            }
        }
    }
});

console.log("✅ [low_stocks_product_alert_variant] ProductCard patch aplicado");
