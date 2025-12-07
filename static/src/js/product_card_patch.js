/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { onMounted, onPatched, onWillUnmount } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

console.log("🔥 [low_stocks_product_alert_variant] product_card_patch.js cargado");

patch(ProductCard.prototype, {
    setup() {
        super.setup(...arguments);
        this.pos = useService("pos");
        console.log("🔧 [Stock Badge] Setup ejecutado para producto:", this.props.product?.name);
        
        // Suscribirse a cambios en el pedido
        this._updateBadgeListener = () => {
            setTimeout(() => this.updateBadgeStock(), 0);
        };
        
        // Usar onMounted con setTimeout para dar tiempo al DOM
        onMounted(() => {
            setTimeout(() => {
                console.log("🎯 [Stock Badge] onMounted delayed - producto:", this.props.product?.name);
                this.addAlertBadge();
                
                // Escuchar cambios en el carrito
                if (this.pos.get_order()) {
                    this.pos.get_order().orderlines.on('add remove change', null, this._updateBadgeListener);
                }
            }, 0);
        });
        
        // También usar onPatched por si acaso
        onPatched(() => {
            console.log("🔄 [Stock Badge] onPatched - producto:", this.props.product?.name);
            this.updateBadgeStock();
        });
        
        onWillUnmount(() => {
            // Limpiar el listener
            if (this.pos.get_order()) {
                this.pos.get_order().orderlines.off('add remove change', null, this._updateBadgeListener);
            }
        });
    },
    
    getAvailableStock() {
        const product = this.props.product;
        let availableQty = product.qty_available || 0;
        
        // Restar la cantidad en el carrito actual
        const order = this.pos.get_order();
        if (order) {
            const qtyInCart = order.orderlines.reduce((total, line) => {
                return line.product.id === product.id ? total + line.quantity : total;
            }, 0);
            availableQty -= qtyInCart;
        }
        
        return availableQty;
    },
    
    updateBadgeStock() {
        const product = this.props.product;
        
        if (product.is_storable === false) {
            return;
        }
        
        const rootEl = this.el || this.__owl__?.bdom?.el;
        if (!rootEl) return;
        
        const badge = rootEl.querySelector('.stock_badge');
        if (!badge) {
            this.addAlertBadge();
            return;
        }
        
        const availableQty = this.getAvailableStock();
        const qtyText = badge.querySelector('.qty-text');
        
        if (qtyText) {
            qtyText.textContent = availableQty.toString();
        }
        
        // Actualizar color del badge según el stock disponible
        const hasAlert = availableQty <= 0 || product.alert_tag;
        if (hasAlert && !badge.classList.contains('alert-danger')) {
            badge.style.backgroundColor = '#dc3545';
            const icon = badge.querySelector('i');
            if (icon) {
                icon.className = 'fa fa-exclamation-triangle';
            }
        } else if (!hasAlert && !badge.classList.contains('alert-success')) {
            badge.style.backgroundColor = '#28a745';
            const icon = badge.querySelector('i');
            if (icon) {
                icon.className = 'fa fa-check-circle';
            }
        }
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
        
        const availableQty = this.getAvailableStock();
        const badge = document.createElement('span');
        badge.className = 'stock_badge position-absolute';
        badge.style.cssText = 'top: 5px; right: 5px; padding: 2px 8px; border-radius: 12px; z-index: 5; font-size: 0.7rem; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.3);';
        
        // Asegurar que el contenedor tenga position relative y overflow visible
        container.style.position = 'relative';
        container.style.overflow = 'visible';
        
        const icon = document.createElement('i');
        icon.className = 'fa';
        icon.style.paddingRight = '3px';
        
        if (product.alert_tag && product.alert_tag !== false || availableQty <= 0) {
            // Producto con alerta de bajo stock (rojo)
            badge.style.backgroundColor = '#dc3545';
            badge.style.color = '#fff';
            badge.classList.add('alert-danger');
            icon.className += ' fa-exclamation-triangle';
            console.log('⚠️ [Alert] Badge agregado:', product.display_name || product.name, 'Stock disponible:', availableQty);
        } else {
            // Producto con stock suficiente (verde)
            badge.style.backgroundColor = '#28a745';
            badge.style.color = '#fff';
            badge.classList.add('alert-success');
            icon.className += ' fa-check-circle';
            console.log('✅ [Stock OK] Badge agregado:', product.display_name || product.name, 'Stock disponible:', availableQty);
        }
        
        badge.appendChild(icon);
        
        const qtySpan = document.createElement('span');
        qtySpan.className = 'qty-text';
        qtySpan.textContent = availableQty.toString();
        badge.appendChild(qtySpan);
        
        container.appendChild(badge);
    }
});

console.log("✅ [low_stocks_product_alert_variant] ProductCard patch aplicado");
