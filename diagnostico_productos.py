"""
Script de diagnóstico para verificar por qué is_storable es False

Ejecutar en shell de Odoo:
python3 odoo-bin shell -d tu_base_de_datos --addons-path=...

Luego:
exec(open('diagnostico_productos.py').read())
"""

print("\n" + "="*70)
print("🔍 DIAGNÓSTICO DE PRODUCTOS - IS_STORABLE")
print("="*70 + "\n")

# Obtener los IDs de productos que aparecen en el log
product_ids = [82, 74, 78, 80, 76, 73, 75, 67, 68, 66, 71, 70, 69, 77, 79, 81, 72]

print("1️⃣ VERIFICANDO PRODUCTOS DEL LOG")
print("-" * 70)

products = env['product.product'].browse(product_ids)

for product in products:
    print(f"\n📦 {product.display_name} (ID: {product.id})")
    print(f"   Tipo: {product.type}")
    print(f"   Is storable (computed): {product.is_storable}")
    print(f"   Detailed type: {product.detailed_type}")
    print(f"   Available in POS: {product.available_in_pos}")
    print(f"   Qty available: {product.qty_available}")
    print(f"   Alert tag: '{product.alert_tag}'")
    
    # Verificar por qué is_storable es False
    if product.type != 'product':
        print(f"   ⚠️ PROBLEMA: Tipo es '{product.type}', debería ser 'product'")
    
    if not product.is_storable:
        print(f"   ⚠️ Este producto NO es almacenable")

# Buscar productos que SÍ sean almacenables
print("\n2️⃣ BUSCANDO PRODUCTOS ALMACENABLES")
print("-" * 70)

storable_products = env['product.product'].search([
    ('type', '=', 'product'),
    ('available_in_pos', '=', True)
], limit=10)

print(f"\n✅ Productos almacenables disponibles en POS: {len(storable_products)}")

if storable_products:
    print("\nPrimeros 5 productos almacenables:")
    for product in storable_products[:5]:
        print(f"\n   📦 {product.display_name} (ID: {product.id})")
        print(f"      Tipo: {product.type}")
        print(f"      Is storable: {product.is_storable}")
        print(f"      Stock: {product.qty_available}")
        print(f"      Alert tag: '{product.alert_tag}'")
else:
    print("\n❌ NO hay productos almacenables disponibles en POS")
    print("\n💡 SOLUCIÓN: Necesitas crear o configurar productos almacenables")

# Verificar campo _load_pos_data_fields
print("\n3️⃣ VERIFICANDO CAMPOS CARGADOS EN POS")
print("-" * 70)

pos_config = env['pos.config'].search([], limit=1)
if pos_config:
    product_obj = env['product.product']
    pos_fields = product_obj._load_pos_data_fields(pos_config.id)
    
    print(f"\n✅ Config POS: {pos_config.name}")
    print(f"   Total campos cargados: {len(pos_fields)}")
    
    required_fields = ['is_storable', 'alert_tag', 'qty_available', 'type', 'detailed_type']
    print("\n   Campos importantes:")
    for field in required_fields:
        status = "✅" if field in pos_fields else "❌ FALTA"
        print(f"      {status} {field}")

# CREAR PRODUCTO DE PRUEBA ALMACENABLE
print("\n4️⃣ CREANDO PRODUCTO DE PRUEBA ALMACENABLE")
print("-" * 70)

# Buscar o crear categoría
category = env['product.category'].search([('name', '=', 'Test Stock Alert')], limit=1)
if not category:
    category = env['product.category'].create({'name': 'Test Stock Alert'})

# Crear producto almacenable
test_product = env['product.product'].create({
    'name': 'TEST ALMACENABLE - Stock Bajo',
    'type': 'product',  # ← IMPORTANTE: tipo 'product' = almacenable
    'detailed_type': 'product',
    'categ_id': category.id,
    'list_price': 100.0,
    'available_in_pos': True,
})

# Establecer stock
location = env.ref('stock.stock_location_stock')
env['stock.quant'].create({
    'product_id': test_product.id,
    'location_id': location.id,
    'quantity': 3.0,  # Stock bajo
})

# Recalcular
test_product._compute_alert_tag()
env.cr.commit()

print(f"\n✅ Producto de prueba creado:")
print(f"   Nombre: {test_product.display_name}")
print(f"   ID: {test_product.id}")
print(f"   Tipo: {test_product.type}")
print(f"   Is storable: {test_product.is_storable}")
print(f"   Stock: {test_product.qty_available}")
print(f"   Alert tag: '{test_product.alert_tag}'")

# CONVERTIR PRODUCTOS EXISTENTES A ALMACENABLES
print("\n5️⃣ ¿CONVERTIR PRODUCTOS EXISTENTES A ALMACENABLES?")
print("-" * 70)

non_storable = env['product.product'].browse(product_ids)
print(f"\nProductos del log: {len(non_storable)}")
print(f"No almacenables: {len(non_storable.filtered(lambda p: not p.is_storable))}")

print("\n💡 Para convertir los productos a almacenables, ejecuta:")
print("""
# CAMBIAR PRODUCTOS A ALMACENABLES
product_ids = [82, 74, 78, 80, 76, 73, 75, 67, 68, 66, 71, 70, 69, 77, 79, 81, 72]
products = env['product.product'].browse(product_ids)
products.write({
    'type': 'product',
    'detailed_type': 'product'
})

# Recalcular alertas
products._compute_alert_tag()
env.cr.commit()

# Verificar
for p in products:
    print(f"{p.display_name}: type={p.type}, is_storable={p.is_storable}")
""")

print("\n" + "="*70)
print("FIN DEL DIAGNÓSTICO")
print("="*70 + "\n")
