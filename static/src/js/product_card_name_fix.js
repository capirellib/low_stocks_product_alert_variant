/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { onMounted } from "@odoo/owl";

console.log("🔥 [low_stocks_product_alert_variant] product_card_name_fix.js cargado");

/**
 * Patch para asegurar que el nombre de las variantes se muestre correctamente
 * en las tarjetas de productos del POS
 */
patch(ProductCard.prototype, {
    setup() {
        super.setup(...arguments);
        
        onMounted(() => {
            setTimeout(() => this.ensureProductNameVisible(), 0);
        });
    },
    
    ensureProductNameVisible() {
        const product = this.props.product;
        const rootEl = this.el || this.__owl__?.bdom?.el;
        
        if (!rootEl || !product) return;
        
        // Buscar el elemento del nombre del producto
        let nameElement = rootEl.querySelector('.product-name');
        if (!nameElement) nameElement = rootEl.querySelector('.product-content h6');
        if (!nameElement) nameElement = rootEl.querySelector('h6');
        
        if (nameElement) {
            // Forzar el display_name correcto
            const productName = product.display_name || product.name;
            if (productName && nameElement.textContent !== productName) {
                nameElement.textContent = productName;
                console.log('✅ [Name Fix] Nombre actualizado para:', productName);
            }
        } else {
            // Si no existe elemento de nombre, crearlo
            const productContent = rootEl.querySelector('.product-content');
            if (productContent) {
                const h6 = document.createElement('h6');
                h6.className = 'product-name';
                h6.textContent = product.display_name || product.name;
                h6.style.cssText = 'margin: 5px 0; font-size: 0.9rem; font-weight: 500; text-align: center;';
                productContent.insertBefore(h6, productContent.firstChild);
                console.log('✅ [Name Fix] Nombre creado para:', product.display_name || product.name);
            }
        }
    }
});

console.log("✅ [low_stocks_product_alert_variant] ProductCard name fix aplicado");
