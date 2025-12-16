/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";

console.log("💳 [Stock Alert] payment_screen_patch.js cargando...");

patch(PaymentScreen.prototype, {
    async validateOrder(isForceValidate) {
        console.log("💳 [Stock Alert] Validando orden...");
        
        // Obtener productos de la orden ANTES de validar
        const order = this.pos.get_order();
        const productsToUpdate = [];
        
        if (order) {
            const lines = order.get_orderlines() || [];
            console.log("📋 [Stock Alert] Cantidad de líneas en la orden:", lines.length);
            
            for (const line of lines) {
                if (!line) continue;
                
                // Intentar múltiples formas de obtener el product_id
                let productId = null;
                
                if (line.product && line.product.id) {
                    productId = line.product.id;
                } else if (line.product_id) {
                    // Puede ser un objeto o un número
                    productId = typeof line.product_id === 'object' ? line.product_id.id : line.product_id;
                } else if (line.get_product) {
                    const product = line.get_product();
                    productId = product ? product.id : null;
                }
                
                if (productId) {
                    productsToUpdate.push(productId);
                    console.log("  ✅ Producto ID agregado:", productId);
                }
            }
            console.log("📋 [Stock Alert] Productos en la orden:", productsToUpdate);
        }
        
        // Llamar al método original
        const result = await super.validateOrder(isForceValidate);
        
        console.log("🔍 [Stock Alert] Resultado de validateOrder:", result);
        
        // Actualizar el stock si hay productos (independiente del resultado)
        if (productsToUpdate.length > 0) {
            console.log("✅ [Stock Alert] Procesando actualización de stock");
            
            // Esperar un momento para que el servidor procese la orden
            setTimeout(async () => {
                try {
                    await this.reloadProductStock(productsToUpdate);
                } catch (error) {
                    console.error("❌ [Stock Alert] Error al actualizar stock:", error);
                }
            }, 2000);
        } else {
            console.log("⚠️ [Stock Alert] Sin productos para actualizar");
        }
        
        return result;
    },
    
    async reloadProductStock(productIds) {
        console.log("🔄 [Stock Alert] Recargando stock desde el servidor para productos:", productIds);
        
        try {
            // Usar el ORM de Odoo para leer los productos
            const updatedProducts = await this.env.services.orm.call(
                "product.product",
                "read",
                [productIds, ["qty_available"]]
            );
            
            console.log("📦 [Stock Alert] Datos recibidos del servidor:", updatedProducts);
            
            // Actualizar qty_available en los productos del POS
            for (const updatedProd of updatedProducts) {
                // En Odoo 18, acceder a productos mediante this.pos.data.read()
                const allProducts = this.pos.models["product.product"].getAll();
                const product = allProducts.find(p => p.id === updatedProd.id);
                
                if (product) {
                    const oldQty = product.qty_available;
                    product.qty_available = updatedProd.qty_available;
                    console.log(`📊 [Stock Alert] ${product.display_name}: ${oldQty} → ${updatedProd.qty_available}`);
                } else {
                    console.log(`⚠️ [Stock Alert] Producto ID ${updatedProd.id} no encontrado en caché`);
                }
            }
            
            // Disparar evento para actualizar badges
            const event = new CustomEvent('pos_cart_updated', {
                detail: { timestamp: Date.now(), source: 'payment_validation' }
            });
            window.dispatchEvent(event);
            console.log("🔔 [Stock Alert] Evento de actualización disparado después de validar orden");
            
        } catch (error) {
            console.error("❌ [Stock Alert] Error al recargar stock:", error);
            console.error("❌ Detalles del error:", error.message, error.stack);
        }
    }
});

console.log("✅ [Stock Alert] PaymentScreen patch aplicado correctamente");
