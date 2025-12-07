/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { onMounted, onWillUnmount } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

console.log("🔥 [low_stocks_product_alert_variant] product_card_patch.js cargado");

// Clave para localStorage
const CART_STORAGE_KEY = 'pos_variant_cart_quantities';

// Obtener cantidades del carrito desde localStorage
function getCartQuantities() {
    try {
        const data = localStorage.getItem(CART_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        return {};
    }
}

// Guardar cantidades en localStorage y notificar
function saveCartQuantities(quantities) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(quantities));
        window.dispatchEvent(new CustomEvent('pos_cart_updated', { detail: quantities }));
    } catch (e) {
        console.error('Error guardando carrito:', e);
    }
}

patch(ProductCard.prototype, {
    setup() {
        super.setup(...arguments);
        this.pos = useService("pos");
        
        // Listener para actualizar badge cuando cambia el carrito
        this._cartUpdateListener = () => {
            this.updateBadgeStock();
        };
        
        onMounted(() => {
            setTimeout(() => this.addAlertBadge(), 0);
            
            // Escuchar cambios en el carrito
            window.addEventListener('pos_cart_updated', this._cartUpdateListener);
        });
        
        onWillUnmount(() => {
            window.removeEventListener('pos_cart_updated', this._cartUpdateListener);
        });
    },
    
    getAvailableStock() {
        const product = this.props.product;
        let availableQty = product.qty_available || 0;
        
        // Restar cantidad en el carrito desde localStorage
        const cartQuantities = getCartQuantities();
        const qtyInCart = cartQuantities[product.id] || 0;
        availableQty -= qtyInCart;
        
        return availableQty;
    },
    
    updateBadgeStock() {
        const product = this.props.product;
        
        // Salir rápidamente si no es almacenable
        if (product.is_storable === false) {
            return;
        }

        // Solo actualizar si las variantes se muestran como productos independientes
        const config = this.pos?.config;
        if (!config?.show_variants_as_products) {
            return;
        }
        
        const rootEl = this.el || this.__owl__?.bdom?.el;
        if (!rootEl) {
            return;
        }
        
        const availableQty = this.getAvailableStock();
        const hasAlert = availableQty <= 0 || product.alert_tag;
        
        const badge = rootEl.querySelector('.stock_badge');
        
        // Si ahora tiene alerta, eliminar nuestro badge (el módulo padre lo mostrará)
        if (hasAlert && badge) {
            badge.remove();
            return;
        }
        
        // Si no tiene alerta pero no existe badge, crearlo
        if (!hasAlert && !badge) {
            this.addAlertBadge();
            return;
        }
        
        // Si no tiene alerta y existe badge, actualizar solo si cambió
        if (!hasAlert && badge) {
            const qtyText = badge.querySelector('.qty-text');
            if (qtyText) {
                const newQtyStr = availableQty.toString();
                if (qtyText.textContent !== newQtyStr) {
                    qtyText.textContent = newQtyStr;
                    console.log('✅ [Badge Update]', product.display_name, '→', newQtyStr);
                }
            }
        }
    },
    
    addAlertBadge() {
        const product = this.props.product;
        
        // Solo productos almacenables
        if (product.is_storable === false) {
            return;
        }

        // Solo mostrar si las variantes se muestran como productos independientes
        const config = this.pos?.config;
        if (!config?.show_variants_as_products) {
            // Si no está activo, dejar que el módulo padre maneje las alertas
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
        
        // Solo mostrar badge si NO hay alerta (stock suficiente)
        // Si hay alerta, el módulo padre ya lo muestra
        if (product.alert_tag && product.alert_tag !== false || availableQty <= 0) {
            console.log('⚠️ [Alert] Producto con alerta, dejando que módulo padre lo maneje:', product.display_name || product.name);
            return;
        }

        const badge = document.createElement('span');
        badge.className = 'stock_badge position-absolute';
        // Usar la misma posición que el badge de alerta: top-0 start-0 translate-middle
        badge.style.cssText = 'top: 0; left: 0; transform: translate(-50%, -50%); margin-left: 20%; margin-top: 9%; padding: 2px 8px; border-radius: 12px; z-index: 3; font-size: 0.7rem; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.3);';
        
        // NO modificar el contenedor para no afectar otros elementos como el botón "i"
        // El badge ya tiene position-absolute, no necesita que el padre sea relative
        
        const icon = document.createElement('i');
        icon.className = 'fa fa-check-circle';
        icon.style.paddingRight = '3px';
        
        // Producto con stock suficiente (verde)
        badge.style.backgroundColor = '#28a745';
        badge.style.color = '#fff';
        badge.classList.add('alert-success');
        console.log('✅ [Stock OK] Badge agregado:', product.display_name || product.name, 'Stock disponible:', availableQty);
        
        badge.appendChild(icon);
        
        const qtySpan = document.createElement('span');
        qtySpan.className = 'qty-text';
        qtySpan.textContent = availableQty.toString();
        badge.appendChild(qtySpan);
        
        container.appendChild(badge);
    }
});

console.log("✅ [low_stocks_product_alert_variant] ProductCard patch aplicado");
