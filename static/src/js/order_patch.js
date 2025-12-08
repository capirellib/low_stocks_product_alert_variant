/** @odoo-module **/

import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { patch } from "@web/core/utils/patch";

console.log("🔥 [low_stocks_product_alert_variant] order_patch.js cargado");

const CART_STORAGE_KEY = 'pos_variant_cart_quantities';

// Actualizar localStorage con todas las cantidades del carrito
function updateCartStorage(pos, changedProductId = null) {
    console.log('📦 [Cart Update] updateCartStorage() llamado');
    console.log('📦 [Cart Update] POS:', pos);
    console.log('📦 [Cart Update] Changed Product ID:', changedProductId);
    
    if (!pos) {
        console.warn('⚠️ [Cart Storage] No hay POS activo');
        return;
    }
    
    const order = pos.get_order();
    if (!order) {
        console.warn('⚠️ [Cart Storage] No hay orden activa');
        return;
    }
    
    const lines = order.get_orderlines();
    console.log('📦 [Cart Update] Total líneas en orden:', lines.length);
    
    const quantities = {};
    const allProductIds = new Set();
    
    for (const line of lines) {
        const productId = line.product.id;
        const qty = line.get_quantity();
        
        console.log(`📦 [Cart Update] Línea: producto ${productId}, cantidad ${qty}`);
        
        if (productId) {
            quantities[productId] = (quantities[productId] || 0) + qty;
            allProductIds.add(productId);
        }
    }
    
    // Agregar producto que cambió (por si fue eliminado)
    if (changedProductId) {
        allProductIds.add(changedProductId);
    }
    
    try {
        console.log('💾 [Cart Update] Guardando en localStorage:', quantities);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(quantities));
        console.log('💾 [Cart Update] localStorage guardado exitosamente');
        
        console.log('📡 [Cart Update] Emitiendo evento pos_cart_updated');
        window.dispatchEvent(new CustomEvent('pos_cart_updated', { 
            detail: {
                quantities,
                changedProducts: Array.from(allProductIds)
            }
        }));
        console.log('✅ [Cart Storage] Actualizado:', quantities, 'Productos afectados:', Array.from(allProductIds));
    } catch (e) {
        console.error('❌ [Cart Storage] Error guardando carrito:', e);
    }
}

// Patch del ProductScreen para interceptar cuando se agrega un producto
patch(ProductScreen.prototype, {
    async _onClickProduct(clickEvent) {
        console.log('🛒 [ProductScreen Patch] _onClickProduct interceptado');
        console.log('🛒 [ProductScreen Patch] Evento:', clickEvent);
        
        // Llamar al método original
        await super._onClickProduct(...arguments);
        
        // Obtener el producto del evento
        const product = clickEvent.detail;
        console.log('🛒 [ProductScreen Patch] Producto clickeado:', product?.id, product?.display_name);
        
        // Actualizar el carrito
        if (product?.id) {
            setTimeout(() => {
                console.log('🛒 [ProductScreen Patch] Actualizando carrito para producto:', product.id);
                updateCartStorage(this.pos, product.id);
            }, 100); // Pequeño delay para que se agregue la línea
        }
    },
    
    async _setValue(val) {
        console.log('🔢 [ProductScreen Patch] _setValue interceptado:', val);
        await super._setValue(...arguments);
        
        // Actualizar carrito cuando cambia cantidad
        setTimeout(() => {
            console.log('🔢 [ProductScreen Patch] Actualizando carrito después de cambiar valor');
            updateCartStorage(this.pos, null);
        }, 100);
    },
});

console.log("✅ [low_stocks_product_alert_variant] ProductScreen patch aplicado");

