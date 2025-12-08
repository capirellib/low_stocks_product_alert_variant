/** @odoo-module **/

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";

const CART_STORAGE_KEY = 'pos_variant_cart_quantities';

patch(PaymentScreen.prototype, {
    setup() {
        super.setup(...arguments);
        this.orm = useService("orm");
        
        // Guardar referencia al modelo de productos para actualización posterior
        this.productModel = this.env.services.pos?.models?.['product.product'];
    },
    
    async validateOrder(isForceValidate) {
        const order = this.currentOrder;
        
        // Guardar productos antes de validar
        const productsInOrder = [];
        if (order) {
            const lines = order.get_orderlines();
            
            for (const line of lines) {
                const productId = line.product_id?.id;
                const qty = line.get_quantity();
                
                if (productId && qty > 0) {
                    productsInOrder.push({
                        product_id: productId,
                        qty: qty
                    });
                }
            }
        }
        
        console.log('🔄 [SYNC] Productos a sincronizar:', productsInOrder);
        
        // Sincronizar en background (sin bloquear el flujo)
        if (productsInOrder.length > 0) {
            this.syncStockInBackground(productsInOrder);
        }
        
        // Llamar al método padre para validar
        const result = await super.validateOrder(...arguments);
        
        return result;
    },
    
    async syncStockInBackground(productsInOrder) {
        console.log('🔄 [SYNC] Sincronización en background iniciada');
        
        // Guardar referencias a servicios globales
        const orm = this.env.services.orm;
        const productModel = this.productModel;
        
        // Esperar un poco para que la UI se estabilice
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            // Llamar backend usando ORM del servicio global
            const result = await orm.call(
                'product.product',
                'update_stock_after_sale',
                [productsInOrder],
                {}
            );
            
            if (result && result.success) {
                console.log('✅ [BACKEND] Stock actualizado:', result.updated_products);
            }
        } catch (error) {
            console.error('❌ [BACKEND] Error:', error);
        }
        
        // Limpiar localStorage
        try {
            localStorage.removeItem(CART_STORAGE_KEY);
            window.dispatchEvent(new CustomEvent('pos_cart_updated', { 
                detail: {
                    quantities: {},
                    changedProducts: []
                }
            }));
        } catch (e) {
            console.error('Error limpiando carrito:', e);
        }
        
        try {
            // Recargar productos usando ORM global
            const products = await orm.searchRead(
                'product.product',
                [['id', 'in', productsInOrder.map(p => p.product_id)]],
                ['id', 'qty_available', 'alert_tag'],
                {}
            );
            
            console.log('✅ [RELOAD] Productos obtenidos del backend:', products);
            
            // Actualizar productos en el modelo de Odoo 18
            if (productModel) {
                for (const productData of products) {
                    // En Odoo 18, acceder al registro por ID
                    const productRecord = productModel.get(productData.id);
                    if (productRecord) {
                        productRecord.qty_available = productData.qty_available;
                        productRecord.alert_tag = productData.alert_tag;
                        console.log('✅ [MODEL] Actualizado en modelo:', productRecord.display_name, 'Stock:', productData.qty_available);
                    }
                }
            }
            
            // Notificar actualización con los datos actualizados
            window.dispatchEvent(new CustomEvent('pos_products_reloaded', { 
                detail: { 
                    productIds: productsInOrder.map(p => p.product_id),
                    products: products
                }
            }));
            
            console.log('✅ [SYNC] Sincronización completada');
        } catch (error) {
            console.error('❌ [RELOAD] Error:', error);
        }
    },
});
