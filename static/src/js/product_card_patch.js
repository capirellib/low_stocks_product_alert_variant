/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { onMounted, onWillUnmount } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

const CART_STORAGE_KEY = 'pos_variant_cart_quantities';

function getCartQuantities() {
    try {
        const data = localStorage.getItem(CART_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        return {};
    }
}

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
        
        this._lastQtyInCart = undefined;
        this._pollInterval = null;
        
        this._cartUpdateListener = (event) => {
            const productId = this.props.product?.id;
            const changedProducts = event.detail?.changedProducts || [];
            
            if (changedProducts.length === 0 || changedProducts.includes(productId)) {
                this.updateBadgeStock(true);
            }
        };
        
        this._productsReloadedListener = (event) => {
            const productId = this.props.product?.id;
            const reloadedProductIds = event.detail?.productIds || [];
            const products = event.detail?.products || [];
            
            if (reloadedProductIds.includes(productId)) {
                console.log('🔄 [BADGE] Recargando badge para:', this.props.product?.display_name);
                
                // Actualizar datos del producto en memoria con los datos del evento
                const productData = products.find(p => p.id === productId);
                if (productData) {
                    this.props.product.qty_available = productData.qty_available;
                    this.props.product.alert_tag = productData.alert_tag;
                    console.log('✅ [BADGE] Stock actualizado:', productData.qty_available);
                }
                
                const rootEl = this.el || this.__owl__?.bdom?.el;
                if (rootEl) {
                    const oldBadge = rootEl.querySelector('.stock_badge');
                    if (oldBadge) {
                        oldBadge.remove();
                    }
                }
                
                setTimeout(() => this.addAlertBadge(), 100);
            }
        };
        
        this._checkCartChanges = () => {
            const order = this.pos?.get_order?.();
            if (!order) return;
            
            const product = this.props.product;
            if (!product) return;
            
            const lines = order.get_orderlines();
            const productLine = lines.find(l => l.product_id?.id === product.id);
            const currentQtyInCart = productLine ? productLine.get_quantity() : 0;
            
            if (this._lastQtyInCart !== undefined && this._lastQtyInCart !== currentQtyInCart) {
                this.updateBadgeStock(true);
            }
            
            this._lastQtyInCart = currentQtyInCart;
        };
        
        onMounted(() => {
            setTimeout(() => this.addAlertBadge(), 0);
            window.addEventListener('pos_cart_updated', this._cartUpdateListener);
            window.addEventListener('pos_products_reloaded', this._productsReloadedListener);
            this._pollInterval = setInterval(() => this._checkCartChanges(), 500);
        });
        
        onWillUnmount(() => {
            window.removeEventListener('pos_cart_updated', this._cartUpdateListener);
            window.removeEventListener('pos_products_reloaded', this._productsReloadedListener);
            
            if (this._pollInterval) {
                clearInterval(this._pollInterval);
            }
        });
    },
    
    getAvailableStock() {
        const product = this.props.product;
        let availableQty = product.qty_available || 0;
        
        const order = this.pos?.get_order?.();
        if (order) {
            const lines = order.get_orderlines();
            const productLine = lines.find(l => l.product_id?.id === product.id);
            const qtyInCart = productLine ? productLine.get_quantity() : 0;
            availableQty -= qtyInCart;
        }
        
        return availableQty;
    },
    
    updateBadgeStock(animated = false) {
        const product = this.props.product;
        if (product.is_storable === false) return;

        const config = this.pos?.config;
        if (!config?.show_variants_as_products) return;
        
        const rootEl = this.el || this.__owl__?.bdom?.el;
        if (!rootEl) return;
        
        const availableQty = this.getAvailableStock();
        const hasAlert = availableQty <= 0 || product.alert_tag;
        
        const badge = rootEl.querySelector('.stock_badge');
        
        if (hasAlert && badge) {
            if (animated) {
                badge.classList.add('badge-removing');
                setTimeout(() => badge.remove(), 300);
            } else {
                badge.remove();
            }
            return;
        }
        
        if (!hasAlert && !badge) {
            this.addAlertBadge();
            return;
        }
        
        if (!hasAlert && badge) {
            const qtyText = badge.querySelector('.qty-text');
            if (qtyText) {
                const oldQty = parseInt(qtyText.textContent) || 0;
                const newQty = availableQty;
                
                if (oldQty !== newQty) {
                    qtyText.textContent = newQty.toString();
                    
                    if (animated) {
                        if (newQty < oldQty) {
                            badge.classList.add('badge-decrease');
                            setTimeout(() => badge.classList.remove('badge-decrease'), 500);
                        } else {
                            badge.classList.add('badge-increase');
                            setTimeout(() => badge.classList.remove('badge-increase'), 500);
                        }
                    }
                    
                    this.updateBadgeColor(badge, newQty);
                }
            }
        }
    },
    
    updateBadgeColor(badge, qty) {
        badge.classList.remove('alert-success', 'alert-warning', 'alert-danger');
        
        const minStock = 5;
        
        if (qty <= 0) {
            badge.style.backgroundColor = '#dc3545';
            badge.style.color = '#fff';
            badge.classList.add('alert-danger');
        } else if (qty <= minStock * 1.5) {
            badge.style.backgroundColor = '#ffc107';
            badge.style.color = '#000';
            badge.classList.add('alert-warning');
        } else {
            badge.style.backgroundColor = '#28a745';
            badge.style.color = '#fff';
            badge.classList.add('alert-success');
        }
    },
    
    addAlertBadge() {
        const product = this.props.product;
        
        if (product.is_storable === false) return;

        const config = this.pos?.config;
        if (!config?.show_variants_as_products) return;
        
        const rootEl = this.el || this.__owl__?.bdom?.el || document.querySelector(`[data-product-id="${product.id}"]`);
        
        if (!rootEl) return;
        
        let container = rootEl.querySelector?.('.product-img');
        if (!container) container = rootEl.querySelector?.('.product-card');
        if (!container) container = rootEl.querySelector?.('img')?.parentElement;
        if (!container && rootEl.classList?.contains('product-card')) {
            container = rootEl;
        }
        if (!container) container = rootEl;
        
        if (!container) return;
        
        if (container.querySelector('.stock_badge')) return;
        
        const availableQty = this.getAvailableStock();
        
        if (product.alert_tag && product.alert_tag !== false || availableQty <= 0) {
            return;
        }

        const badge = document.createElement('span');
        badge.className = 'stock_badge position-absolute';
        badge.style.cssText = 'top: 0; left: 0; transform: translate(-50%, -50%); margin-left: 20%; margin-top: 9%; padding: 2px 8px; border-radius: 12px; z-index: 3; font-size: 0.7rem; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.3);';
        
        const icon = document.createElement('i');
        icon.className = 'fa fa-check-circle';
        icon.style.paddingRight = '3px';
        
        this.updateBadgeColor(badge, availableQty);
        
        badge.appendChild(icon);
        
        const qtySpan = document.createElement('span');
        qtySpan.className = 'qty-text';
        qtySpan.textContent = availableQty.toString();
        badge.appendChild(qtySpan);
        
        container.appendChild(badge);
    }
});

