/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { onMounted, onPatched } from "@odoo/owl";

console.log("🔥 [low_stocks_product_alert_variant] product_card_patch.js cargado");

patch(ProductCard.prototype, {
    setup() {
        super.setup(...arguments);
        console.log("🔧 [Stock Badge] Setup ejecutado para producto:", this.props.product?.name);
        
        onMounted(() => {
            console.log("🎯 [Stock Badge] onMounted - producto:", this.props.product?.name);
            this.addAlertBadge();
        });
        
        onPatched(() => {
            console.log("🔄 [Stock Badge] onPatched - producto:", this.props.product?.name);
            this.addAlertBadge();
        });
    },
    
    addAlertBadge() {
        const product = this.props.product;
        
        // Solo productos almacenables
        if (product.is_storable === false) {
            return;
        }
        
        // Debug: Ver estructura del elemento
        if (!this.el) {
            console.error('❌ [Stock Badge] this.el es null/undefined para:', product.display_name || product.name);
            return;
        }
        
        console.log('🔍 [DOM Debug] Elemento raíz:', this.el);
        console.log('🔍 [DOM Debug] Classes:', this.el.className);
        console.log('🔍 [DOM Debug] HTML:', this.el.outerHTML.substring(0, 200));
        
        // Buscar el contenedor - puede ser .product-img, .product-card o el elemento raíz mismo
        let container = this.el.querySelector('.product-img');
        if (!container) container = this.el.querySelector('.product-card');
        if (!container) container = this.el.querySelector('img')?.parentElement;
        if (!container && this.el.classList.contains('product-card')) {
            container = this.el;
        }
        
        if (!container) {
            console.warn('❌ [Stock Badge] No se encontró contenedor para:', product.display_name || product.name);
            console.warn('   Selectores probados: .product-img, .product-card, img parent, this.el con clase product-card');
            return;
        }
        
        // Evitar duplicados
        if (container.querySelector('.stock_badge')) {
            return;
        }
        
        const qty = product.qty_available || 0;
        const badge = document.createElement('span');
        badge.className = 'stock_badge position-absolute top-0 start-0 translate-middle';
        badge.style.cssText = 'margin-left: 20%; margin-top: 9%; padding: 1px 10px; border-radius: 5px; z-index: 10; font-size: 0.75rem;';
        
        // Asegurar que el contenedor tenga position relative
        if (container !== this.el.querySelector('.product-img')) {
            container.style.position = 'relative';
        }
        
        const icon = document.createElement('i');
        icon.className = 'fa';
        icon.style.paddingRight = '5px';
        
        if (product.alert_tag && product.alert_tag !== false) {
            // Producto con alerta de bajo stock (rojo)
            badge.style.backgroundColor = '#ffcccc';
            icon.className += ' fa-warning text-danger';
            console.log('⚠️ [Alert] Badge agregado:', product.display_name || product.name, 'Stock:', qty);
        } else {
            // Producto con stock suficiente (verde)
            badge.style.backgroundColor = '#ccffcc';
            icon.className += ' fa-check text-success';
            console.log('✅ [Stock OK] Badge agregado:', product.display_name || product.name, 'Stock:', qty);
        }
        
        badge.appendChild(icon);
        badge.appendChild(document.createTextNode(qty.toString()));
        container.appendChild(badge);
    }
});

console.log("✅ [low_stocks_product_alert_variant] ProductCard patch aplicado");
