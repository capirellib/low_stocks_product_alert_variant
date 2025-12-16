// Script de prueba para consola del navegador
// Copiar y pegar en la consola del navegador (F12) cuando estés en el POS

console.log("=".repeat(60));
console.log("DIAGNÓSTICO DE ALERTAS DE STOCK EN POS");
console.log("=".repeat(60));

// 1. Verificar que odoo esté disponible
if (typeof odoo === 'undefined') {
    console.error("❌ odoo no está definido");
} else {
    console.log("✅ odoo está disponible");
}

// 2. Buscar instancia del POS
let posInstance = null;
try {
    // Intentar obtener el servicio POS
    const posService = odoo.__DEBUG__.services['point_of_sale.pos'];
    if (posService) {
        posInstance = posService;
        console.log("✅ Servicio POS encontrado");
    }
} catch (e) {
    console.log("⚠️ No se pudo obtener servicio POS:", e.message);
}

// 3. Verificar productos cargados
if (posInstance && posInstance.models) {
    const productModel = posInstance.models['product.product'];
    if (productModel) {
        const products = productModel.getAllBy();
        console.log(`📦 Total de productos cargados: ${products.length}`);
        
        // Mostrar primeros 5 productos con sus datos
        console.log("\n📊 MUESTRA DE PRODUCTOS:");
        products.slice(0, 5).forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.display_name}`);
            console.log(`   ID: ${product.id}`);
            console.log(`   Stock disponible: ${product.qty_available}`);
            console.log(`   Es almacenable: ${product.is_storable}`);
            console.log(`   Alert tag: '${product.alert_tag}'`);
        });
        
        // Buscar productos con alert_tag
        const productsWithAlert = products.filter(p => 
            p.alert_tag && p.alert_tag !== '0' && p.alert_tag !== 'False'
        );
        console.log(`\n⚠️ Productos con alerta: ${productsWithAlert.length}`);
        
        if (productsWithAlert.length > 0) {
            console.log("\nProductos que DEBERÍAN mostrar badge:");
            productsWithAlert.forEach(p => {
                console.log(`   - ${p.display_name}: Stock=${p.qty_available}, Alert='${p.alert_tag}'`);
            });
        }
    } else {
        console.log("❌ No se encontró el modelo product.product");
    }
} else {
    console.log("❌ No hay instancia POS o modelos no están disponibles");
}

// 4. Verificar elementos DOM
const productCards = document.querySelectorAll('.product-card, .product');
console.log(`\n🖼️ Tarjetas de producto en DOM: ${productCards.length}`);

const badges = document.querySelectorAll('.alert_tag, .stock_badge');
console.log(`🏷️ Badges encontrados: ${badges.length}`);

if (badges.length > 0) {
    console.log("\nBadges en página:");
    badges.forEach((badge, index) => {
        console.log(`   ${index + 1}. Texto: '${badge.textContent}', Clases: ${badge.className}`);
    });
}

// 5. Verificar assets cargados
const scripts = document.querySelectorAll('script[src*="product_card_patch"]');
console.log(`\n📄 product_card_patch.js cargado: ${scripts.length > 0 ? '✅' : '❌'}`);

const xmlTemplates = document.querySelectorAll('templates[xml-space="preserve"]');
console.log(`📄 Templates XML cargados: ${xmlTemplates.length}`);

console.log("\n" + "=".repeat(60));
console.log("FIN DEL DIAGNÓSTICO");
console.log("=".repeat(60));

// Función auxiliar para probar agregar badge manualmente
window.testAddBadge = function(productId) {
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productCard) {
        console.error(`❌ No se encontró tarjeta para producto ${productId}`);
        return;
    }
    
    const imgContainer = productCard.querySelector('.product-img') || productCard;
    
    const badge = document.createElement('span');
    badge.className = 'alert_tag position-absolute top-0 start-0 translate-middle';
    badge.style.cssText = `
        background-color: #dc3545;
        color: white;
        margin-left: 20%;
        margin-top: 9%;
        padding: 4px 10px;
        border-radius: 5px;
        z-index: 10;
        font-size: 0.75rem;
        font-weight: bold;
    `;
    badge.textContent = '⚠️ PRUEBA';
    
    imgContainer.appendChild(badge);
    console.log("✅ Badge de prueba agregado al producto", productId);
};

console.log("\n💡 TIP: Ejecuta testAddBadge(PRODUCT_ID) para agregar un badge de prueba");
