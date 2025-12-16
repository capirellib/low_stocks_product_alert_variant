/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { onMounted, onWillUnmount } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

console.log("🎯 [Stock Alert] product_card_patch.js cargando...");

const CART_STORAGE_KEY = 'pos_variant_cart_quantities';

patch(ProductCard.prototype, {
    setup() {
        super.setup(...arguments);
        this.pos = useService("pos");
        
        // Listener para cambios en el carrito
        this._cartUpdateListener = () => {
            this.updateStockBadge();
        };
        
        onMounted(() => {
            console.log("🎯 [Stock Alert] ProductCard montado, producto:", this.props.product?.display_name);
            
            // Agregar badge inicial
            setTimeout(() => this.addStockBadge(), 100);
            
            // Escuchar cambios en el carrito
            window.addEventListener('pos_cart_updated', this._cartUpdateListener);
        });
        
        onWillUnmount(() => {
            window.removeEventListener('pos_cart_updated', this._cartUpdateListener);
        });
    },
    
    getCartQuantity() {
        const product = this.props.product;
        if (!product) return 0;
        
        try {
            // Obtener cantidad del carrito actual
            const order = this.pos?.get_order?.();
            if (!order) return 0;
            
            const lines = order.get_orderlines?.() || [];
            if (!lines || lines.length === 0) return 0;
            
            // Buscar la línea del producto con validaciones
            let totalQty = 0;
            for (const line of lines) {
                if (!line) continue;
                
                // Intentar múltiples formas de obtener el ID del producto
                let lineProductId = null;
                
                // Opción 1: line.product.id
                if (line.product && line.product.id) {
                    lineProductId = line.product.id;
                }
                // Opción 2: line.product_id (puede ser objeto o número)
                else if (line.product_id) {
                    lineProductId = typeof line.product_id === 'object' ? line.product_id.id : line.product_id;
                }
                // Opción 3: line.get_product()
                else if (line.get_product) {
                    const prod = line.get_product();
                    lineProductId = prod?.id;
                }
                
                // Comparar IDs
                if (lineProductId === product.id) {
                    // Intentar obtener cantidad de diferentes formas
                    const qty = line.get_quantity?.() || line.quantity || line.qty || 0;
                    totalQty += qty;
                }
            }
            
            return totalQty;
        } catch (error) {
            console.error("⚠️ [Stock Alert] Error en getCartQuantity:", error);
            return 0;
        }
    },
    
    getAvailableStock() {
        const product = this.props.product;
        if (!product) return 0;
        
        const stockTotal = product.qty_available || 0;
        const inCart = this.getCartQuantity();
        return Math.max(0, stockTotal - inCart);
    },
    
    updateStockBadge() {
        const product = this.props.product;
        if (!product || product.is_storable === false) return;
        
        const rootEl = this.el || this.__owl__?.bdom?.el;
        if (!rootEl) return;
        
        const badge = rootEl.querySelector('.stock_badge');
        if (!badge) {
            // No mostrar warning si el badge simplemente no existe (puede ser producto sin stock)
            return;
        }
        
        const inCart = this.getCartQuantity();
        const availableStock = this.getAvailableStock();
        const stockText = badge.querySelector('.stock-number');
        
        if (stockText) {
            const oldValue = parseInt(stockText.textContent) || 0;
            stockText.textContent = availableStock.toString();
            
            // Actualizar color
            this.updateBadgeColor(badge, availableStock);
            
            // Animación
            if (availableStock < oldValue) {
                badge.classList.add('badge-decrease');
                setTimeout(() => badge.classList.remove('badge-decrease'), 500);
            } else if (availableStock > oldValue) {
                badge.classList.add('badge-increase');
                setTimeout(() => badge.classList.remove('badge-increase'), 500);
            }
            
            console.log(`🔄 [Stock Alert] Stock actualizado para ${product.display_name}: ${availableStock} (en carrito: ${inCart})`)  ;
        }
    },
    
    updateBadgeColor(badge, stock) {
        const hasAlert = this.props.product.alert_tag && 
                        this.props.product.alert_tag !== '0' && 
                        this.props.product.alert_tag !== 'False';
        
        let bgColor, textColor, iconClass;
        
        if (stock <= 0) {
            bgColor = '#dc3545';
            textColor = 'white';
            iconClass = 'fa-times-circle';
        } else if (hasAlert || stock <= 5) {
            bgColor = '#ffc107';
            textColor = '#000';
            iconClass = 'fa-exclamation-triangle';
        } else {
            bgColor = '#28a745';
            textColor = 'white';
            iconClass = 'fa-check-circle';
        }
        
        badge.style.backgroundColor = bgColor;
        badge.style.color = textColor;
        
        const icon = badge.querySelector('i.fa');
        if (icon) {
            icon.className = `fa ${iconClass}`;
        }
    },
    
    addStockBadge() {
        const product = this.props.product;
        
        if (!product) {
            console.log("⚠️ [Stock Alert] No hay producto");
            return;
        }
        
        console.log("📦 [Stock Alert] Procesando:", product.display_name);
        console.log("   - ID:", product.id);
        console.log("   - Stock total:", product.qty_available);
        console.log("   - Alert tag:", product.alert_tag);
        console.log("   - Is storable:", product.is_storable);
        
        // Solo para productos almacenables
        if (product.is_storable === false) {
            console.log("⏭️ [Stock Alert] No es almacenable, saltando");
            return;
        }
        
        // Buscar el contenedor de la imagen
        const rootEl = this.el || this.__owl__?.bdom?.el;
        if (!rootEl) {
            console.log("❌ [Stock Alert] No se encontró el elemento root");
            return;
        }
        
        let imgContainer = rootEl.querySelector('.product-img');
        if (!imgContainer) {
            console.log("⚠️ [Stock Alert] No se encontró .product-img, usando root");
            imgContainer = rootEl;
        }
        
        // Verificar si ya existe un badge
        if (imgContainer.querySelector('.alert_tag, .stock_badge')) {
            console.log("ℹ️ [Stock Alert] Badge ya existe");
            return;
        }
        
        // Calcular stock disponible (descontando lo que está en el carrito)
        const availableStock = this.getAvailableStock();
        const hasAlert = product.alert_tag && product.alert_tag !== '0' && product.alert_tag !== 'False';
        
        console.log(`📊 [Stock Alert] Stock disponible: ${availableStock}, En carrito: ${this.getCartQuantity()}, Tiene alerta: ${hasAlert}`);
        
        // Crear badge con el stock
        const badge = document.createElement('span');
        badge.className = 'stock_badge position-absolute top-0 start-0 translate-middle';
        
        // Determinar color según stock
        let bgColor, textColor, icon;
        if (availableStock <= 0) {
            bgColor = '#dc3545';
            textColor = 'white';
            icon = 'fa-times-circle';
        } else if (hasAlert || availableStock <= 5) {
            bgColor = '#ffc107';
            textColor = '#000';
            icon = 'fa-exclamation-triangle';
        } else {
            bgColor = '#28a745';
            textColor = 'white';
            icon = 'fa-check-circle';
        }
        
        badge.style.cssText = `
            background-color: ${bgColor};
            color: ${textColor};
            margin-left: 20%;
            margin-top: 9%;
            padding: 4px 10px;
            border-radius: 5px;
            z-index: 10;
            font-size: 0.75rem;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        // Agregar icono
        const iconElement = document.createElement('i');
        iconElement.className = `fa ${icon}`;
        iconElement.style.cssText = 'margin-right: 5px;';
        badge.appendChild(iconElement);
        
        // Agregar número de stock
        const stockText = document.createElement('span');
        stockText.className = 'stock-number';
        stockText.textContent = availableStock.toString();
        stockText.style.fontWeight = 'bold';
        badge.appendChild(stockText);
        
        imgContainer.appendChild(badge);
        console.log(`✅ [Stock Alert] Badge agregado - Stock disponible: ${availableStock}, Color: ${bgColor}`);
    }
});

console.log("✅ [Stock Alert] ProductCard patch aplicado correctamente");
