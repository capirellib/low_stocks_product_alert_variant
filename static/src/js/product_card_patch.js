/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { onMounted, onPatched } from "@odoo/owl";

console.log("🔥 [low_stocks_product_alert_variant] product_card_patch.js cargado");

patch(ProductCard.prototype, {
    setup() {
        super.setup(...arguments);
        console.log("🔧 [Stock Badge] Setup ejecutado para producto:", this.props.product?.name);
        
        // Usar onMounted con setTimeout para dar tiempo al DOM
        onMounted(() => {
            setTimeout(() => {
                console.log("🎯 [Stock Badge] onMounted delayed - producto:", this.props.product?.name);
                this.addAlertBadge();
            }, 0);
        });
        
        // También usar onPatched por si acaso
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
        
        // Intentar obtener el elemento de varias formas
        const rootEl = this.el || this.__owl__?.bdom?.el || document.querySelector(`[data-product-id="${product.id}"]`);
        
        if (!rootEl) {
            console.warn('❌ [Stock Badge] No hay elemento raíz para:', product.display_name || product.name);
            return;
        }
        
        console.log('🔍 [DOM Debug] Elemento encontrado para:', product.display_name || product.name);
        
        // Buscar el contenedor
        let container = rootEl.querySelector?.('.product-img');
        if (!container) container = rootEl.querySelector?.('.product-card');
        if (!container) container = rootEl.querySelector?.('img')?.parentElement;
        if (!container && rootEl.classList?.contains('product-card')) {
            container = rootEl;
        }
        if (!container) container = rootEl; // Usar el elemento raíz como último recurso
        
        if (!container) {
            console.warn('❌ [Stock Badge] No se encontró contenedor para:', product.display_name || product.name);
            return;
        }
        
        // Evitar duplicados
        if (container.querySelector('.stock_badge')) {
            return;
        }
        
        const qty = product.qty_available || 0;
        const badge = document.createElement('span');
        badge.className = 'stock_badge position-absolute';
        badge.style.cssText = 'top: 5px; right: 5px; padding: 2px 8px; border-radius: 12px; z-index: 5; font-size: 0.7rem; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.3);';
        
        // Asegurar que el contenedor tenga position relative y overflow visible
        container.style.position = 'relative';
        container.style.overflow = 'visible';
        
        const icon = document.createElement('i');
        icon.className = 'fa';
        icon.style.paddingRight = '3px';
        
        if (product.alert_tag && product.alert_tag !== false) {
            // Producto con alerta de bajo stock (rojo)
            badge.style.backgroundColor = '#dc3545';
            badge.style.color = '#fff';
            icon.className += ' fa-exclamation-triangle';
            console.log('⚠️ [Alert] Badge agregado:', product.display_name || product.name, 'Stock:', qty);
        } else {
            // Producto con stock suficiente (verde)
            badge.style.backgroundColor = '#28a745';
            badge.style.color = '#fff';
            icon.className += ' fa-check-circle';
            console.log('✅ [Stock OK] Badge agregado:', product.display_name || product.name, 'Stock:', qty);
        }
        
        badge.appendChild(icon);
        badge.appendChild(document.createTextNode(qty.toString()));
        container.appendChild(badge);
    }
});

console.log("✅ [low_stocks_product_alert_variant] ProductCard patch aplicado");
