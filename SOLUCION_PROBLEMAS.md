# 🔧 SOLUCIÓN DE PROBLEMAS - Alertas No Aparecen

## ✅ CHECKLIST COMPLETO

### 1. VERIFICAR CONFIGURACIÓN EN ODOO

Ejecuta esto en el **shell de Odoo**:

```python
# ===== SCRIPT COMPLETO DE DIAGNÓSTICO =====

print("\n" + "="*70)
print("🔍 DIAGNÓSTICO COMPLETO DE ALERTAS DE STOCK")
print("="*70 + "\n")

# 1. Verificar configuración
print("1️⃣ CONFIGURACIÓN DEL SISTEMA")
print("-" * 70)

is_enabled = env['ir.config_parameter'].sudo().get_param(
    'low_stocks_product_alert_variant.is_low_stock_alert')
min_stock = env['ir.config_parameter'].sudo().get_param(
    'low_stocks_product_alert_variant.min_low_stock_alert', default='0')

print(f"   Alertas habilitadas: {is_enabled}")
print(f"   Stock mínimo configurado: {min_stock}")

if is_enabled != 'True':
    print("\n   ❌ PROBLEMA CRÍTICO: Las alertas NO están habilitadas")
    print("   📝 SOLUCIÓN:")
    print("      1. Ve a Settings → Inventory → Operations")
    print("      2. Busca 'Low Stock Alert'")
    print("      3. ACTIVA la casilla")
    print("      4. Configura 'Alert Quantity' (ej: 5)")
    print("      5. GUARDAR\n")
    # Activar automáticamente
    env['ir.config_parameter'].sudo().set_param(
        'low_stocks_product_alert_variant.is_low_stock_alert', 'True')
    env['ir.config_parameter'].sudo().set_param(
        'low_stocks_product_alert_variant.min_low_stock_alert', '5')
    env.cr.commit()
    print("   ✅ Alertas activadas automáticamente con umbral de 5 unidades")
    is_enabled = 'True'
    min_stock = '5'

# 2. Verificar productos
print("\n2️⃣ PRODUCTOS EN EL SISTEMA")
print("-" * 70)

all_products = env['product.product'].search([('is_storable', '=', True)])
print(f"   Total productos almacenables: {len(all_products)}")

products_with_stock = all_products.filtered(lambda p: p.qty_available > 0)
print(f"   Productos con stock > 0: {len(products_with_stock)}")

# Recalcular alertas
print("\n   🔄 Recalculando alertas...")
all_products._compute_alert_tag()
env.cr.commit()
print("   ✅ Alertas recalculadas")

# Productos con alerta
products_with_alert = all_products.filtered(
    lambda p: p.alert_tag and p.alert_tag not in ('0', 'False', False)
)
print(f"   Productos con alerta activa: {len(products_with_alert)}")

# 3. Mostrar ejemplos
print("\n3️⃣ EJEMPLOS DE PRODUCTOS (primeros 5 con menos stock)")
print("-" * 70)

sample_products = env['product.product'].search([
    ('is_storable', '=', True)
], order='qty_available', limit=5)

for product in sample_products:
    product._compute_alert_tag()
    status = "⚠️ ALERTA" if product.alert_tag else "✅ OK"
    print(f"\n   {status} {product.display_name}")
    print(f"      ID: {product.id}")
    print(f"      Stock disponible: {product.qty_available}")
    print(f"      Alert tag: '{product.alert_tag}'")
    print(f"      Alert state: {product.alert_state}")
    
    if product.qty_available <= int(min_stock):
        if product.alert_tag:
            print(f"      ✅ Correcto: Muestra alerta (stock {product.qty_available} <= {min_stock})")
        else:
            print(f"      ❌ ERROR: Debería mostrar alerta pero alert_tag es '{product.alert_tag}'")

# 4. Verificar campos en POS
print("\n4️⃣ CAMPOS CARGADOS EN POS")
print("-" * 70)

pos_configs = env['pos.config'].search([], limit=1)
if pos_configs:
    config = pos_configs[0]
    product_obj = env['product.product']
    pos_fields = product_obj._load_pos_data_fields(config.id)
    
    required_fields = ['alert_tag', 'qty_available', 'is_storable']
    print("   Campos requeridos en POS:")
    for field in required_fields:
        status = "✅" if field in pos_fields else "❌ FALTA"
        print(f"      {status} {field}")
    
    if not all(f in pos_fields for f in required_fields):
        print("\n   ⚠️ ADVERTENCIA: Faltan campos en POS")
        print("   Esto se debería solucionar automáticamente al cargar el POS")

# 5. Crear producto de prueba si no hay ninguno con alerta
print("\n5️⃣ CREAR PRODUCTO DE PRUEBA")
print("-" * 70)

if len(products_with_alert) == 0:
    print("   No hay productos con alerta. Creando uno de prueba...")
    
    # Buscar o crear categoría
    category = env['product.category'].search([('name', '=', 'Prueba Stock')], limit=1)
    if not category:
        category = env['product.category'].create({'name': 'Prueba Stock'})
    
    # Crear producto de prueba
    test_product = env['product.product'].create({
        'name': 'PRODUCTO PRUEBA - Stock Bajo',
        'type': 'product',  # almacenable
        'categ_id': category.id,
        'list_price': 10.0,
        'available_in_pos': True,
    })
    
    # Actualizar stock a 2 (por debajo del umbral de 5)
    quant = env['stock.quant'].create({
        'product_id': test_product.id,
        'location_id': env.ref('stock.stock_location_stock').id,
        'quantity': 2.0,
    })
    
    test_product._compute_alert_tag()
    env.cr.commit()
    
    print(f"   ✅ Producto de prueba creado:")
    print(f"      Nombre: {test_product.display_name}")
    print(f"      ID: {test_product.id}")
    print(f"      Stock: {test_product.qty_available}")
    print(f"      Alert tag: '{test_product.alert_tag}'")
    print(f"\n   📍 Busca este producto en el POS para ver el badge")

print("\n" + "="*70)
print("🎯 PASOS SIGUIENTES:")
print("="*70)
print("""
1. ✅ Reinicia Odoo:
   docker restart odoo18-web
   
2. ✅ Abre el POS y limpia caché del navegador:
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   
3. ✅ Abre la consola del navegador (F12)
   - Deberías ver mensajes: "✅ [Stock Alert] product_card_patch.js cargando..."
   - Busca errores en rojo
   
4. ✅ En la consola, ejecuta el script de diagnóstico:
   (copiar contenido de test_pos_browser.js)
   
5. ✅ Busca productos con stock bajo (≤ 5 unidades)
   - Deben mostrar un badge rojo con ⚠️ y el número
""")

print("\n" + "="*70)
print("DIAGNÓSTICO COMPLETO")
print("="*70 + "\n")
```

### 2. VERIFICAR EN EL NAVEGADOR (Consola F12)

Cuando estés en el POS, abre la consola (F12) y ejecuta:

```javascript
// Copiar y pegar en la consola del navegador
const products = odoo.__DEBUG__.services['point_of_sale.pos'].models['product.product'].getAllBy();
console.log("Total productos:", products.length);

const withAlert = products.filter(p => p.alert_tag && p.alert_tag !== '0');
console.log("Productos con alerta:", withAlert.length);

withAlert.forEach(p => {
    console.log(`- ${p.display_name}: stock=${p.qty_available}, alert='${p.alert_tag}'`);
});
```

### 3. ERRORES COMUNES

#### ❌ Error: "alert_tag is undefined"
**Causa**: El campo no se está cargando en el POS
**Solución**:
```python
# En shell de Odoo
env['product.product'].search([])._compute_alert_tag()
env.cr.commit()
```

#### ❌ Los badges no aparecen visualmente
**Causa**: CSS no cargado o JS no ejecutándose
**Solución**:
1. Verificar en la consola que no haya errores JavaScript
2. Verificar que se cargó: `product_card_patch.js`
3. Limpiar caché del navegador (Ctrl+Shift+R)

#### ❌ Alert tag siempre es False
**Causa**: Alertas no activadas
**Solución**:
```python
# Activar manualmente
env['ir.config_parameter'].sudo().set_param(
    'low_stocks_product_alert_variant.is_low_stock_alert', 'True')
env['ir.config_parameter'].sudo().set_param(
    'low_stocks_product_alert_variant.min_low_stock_alert', '5')
env.cr.commit()

# Recalcular
env['product.product'].search([])._compute_alert_tag()
env.cr.commit()
```

### 4. PRUEBA MANUAL

Para verificar que el sistema funciona, crea un producto de prueba:

```python
# En shell de Odoo
product = env['product.product'].create({
    'name': 'TEST - Stock Bajo',
    'type': 'product',
    'list_price': 10.0,
    'available_in_pos': True,
})

# Asignar stock bajo
env['stock.quant'].create({
    'product_id': product.id,
    'location_id': env.ref('stock.stock_location_stock').id,
    'quantity': 2.0,
})

product._compute_alert_tag()
print(f"ID: {product.id}")
print(f"Stock: {product.qty_available}")
print(f"Alert: '{product.alert_tag}'")
```

Busca ese producto en el POS (ID: XXX) y verifica que tenga el badge rojo con "⚠️ 2"

### 5. LOGS ÚTILES

En el log de Odoo busca:
```
✅ [Stock Alert] product_card_patch.js cargando...
✅ [Stock Alert] ProductCard patch aplicado correctamente
```

En la consola del navegador busca:
```
🎯 [Stock Alert] ProductCard montado, producto: [nombre]
📦 [Stock Alert] Procesando: [nombre]
✨ [Stock Alert] Creando badge con stock: 2
✅ [Stock Alert] Badge agregado correctamente
```

---

## 🆘 SI NADA FUNCIONA

1. **Desinstala el módulo completamente**
2. **Elimina los archivos `__pycache__`**
3. **Reinicia Odoo**
4. **Instala de nuevo**
5. **Ejecuta el script de diagnóstico completo**
6. **Limpia caché del navegador**

---

**Última actualización**: 15/12/2025
