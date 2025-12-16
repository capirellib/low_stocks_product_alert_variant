# 🔴 PROBLEMA: Todos los productos tienen is_storable = False

## 🔍 Diagnóstico

Según los logs de la consola, **TODOS** tus productos tienen `is_storable: false`:

```
   - Is storable: false
   ⏭️ [Stock Alert] No es almacenable, saltando
```

Esto significa que los productos **NO están configurados como almacenables** en Odoo.

## ✅ SOLUCIÓN RÁPIDA

### Opción 1: Ejecutar en Shell de Odoo (RECOMENDADO)

Abre el shell de Odoo y ejecuta este código:

```python
# ======== COPIAR TODO ESTE CÓDIGO EN EL SHELL ========

print("\n" + "="*70)
print("🔧 CONVIRTIENDO PRODUCTOS A ALMACENABLES")
print("="*70 + "\n")

# IDs de tus productos del log
product_ids = [82, 74, 78, 80, 76, 73, 75, 67, 68, 66, 71, 70, 69, 77, 79, 81, 72]

# Buscar productos
products = env['product.product'].browse(product_ids)

print(f"📦 Total productos a convertir: {len(products)}\n")

# Convertir a almacenables
for product in products:
    print(f"   Convirtiendo: {product.display_name}")
    product.write({
        'type': 'product',  # ← CLAVE: 'product' = almacenable
        'detailed_type': 'product'
    })

print("\n✅ Productos convertidos a almacenables")

# Activar alertas si no están activas
env['ir.config_parameter'].sudo().set_param(
    'low_stocks_product_alert_variant.is_low_stock_alert', 'True')
env['ir.config_parameter'].sudo().set_param(
    'low_stocks_product_alert_variant.min_low_stock_alert', '5')

print("✅ Alertas activadas con umbral de 5 unidades")

# Asignar stock a algunos productos para prueba
print("\n📊 Asignando stock de prueba...")

location = env.ref('stock.stock_location_stock')

# Asignar diferentes niveles de stock
stock_levels = [2, 3, 4, 8, 10, 0, 1, 5, 6, 7, 9, 11, 12, 13, 14, 15, 16]

for i, product in enumerate(products):
    qty = stock_levels[i] if i < len(stock_levels) else 5
    
    # Buscar o crear quant
    quant = env['stock.quant'].search([
        ('product_id', '=', product.id),
        ('location_id', '=', location.id)
    ], limit=1)
    
    if quant:
        quant.quantity = qty
    else:
        env['stock.quant'].create({
            'product_id': product.id,
            'location_id': location.id,
            'quantity': qty,
        })
    
    print(f"   {product.display_name}: stock = {qty}")

print("\n✅ Stock asignado")

# Recalcular alertas
print("\n🔄 Recalculando alertas...")
products._compute_alert_tag()
env.cr.commit()

print("✅ Alertas recalculadas y guardadas")

# Mostrar resultados
print("\n" + "="*70)
print("📊 RESULTADOS")
print("="*70 + "\n")

for product in products:
    symbol = "⚠️" if product.alert_tag else "✅"
    print(f"{symbol} {product.display_name} (ID: {product.id})")
    print(f"   Tipo: {product.type}")
    print(f"   Is storable: {product.is_storable}")
    print(f"   Stock: {product.qty_available}")
    print(f"   Alert tag: '{product.alert_tag}'")
    print()

with_alert = products.filtered(lambda p: p.alert_tag)
print(f"✅ Productos con alerta activa: {len(with_alert)}")
print(f"📦 Productos sin alerta: {len(products) - len(with_alert)}")

print("\n" + "="*70)
print("🎯 SIGUIENTE PASO: Reinicia Odoo y recarga el POS")
print("="*70 + "\n")

print("Comandos:")
print("  docker restart odoo18-web")
print("  Luego abre el POS y presiona Ctrl+Shift+R")
```

### Opción 2: Desde la Interfaz de Odoo

1. Ve a **Inventory → Products → Products**
2. Busca cada uno de tus productos
3. Edita el producto
4. En la pestaña **General Information**:
   - Cambia **Product Type** a: **Storable Product**
5. Guarda
6. Repite para cada producto

## 🎯 Verificar que Funcionó

Después de ejecutar el script, reinicia Odoo:

```bash
docker restart odoo18-web
```

Luego abre el POS nuevamente y verifica en la consola (F12):

```
📦 [Stock Alert] Procesando: Tenis deportivos
   - ID: 82
   - Stock: 2
   - Alert tag: "2"  ← Ahora debería tener un valor
   - Is storable: true  ← Ahora debería ser true
✨ [Stock Alert] Creando badge con stock: 2
✅ [Stock Alert] Badge agregado correctamente
```

## 📋 ¿Por Qué Pasó Esto?

En Odoo, los productos pueden ser de 3 tipos:

| Tipo | Valor `type` | `is_storable` | Gestión de Stock |
|------|-------------|---------------|------------------|
| **Consumable** | `consu` | ❌ False | No |
| **Service** | `service` | ❌ False | No |
| **Storable Product** | `product` | ✅ True | Sí |

Tus productos estaban configurados como **Consumable** o **Service**, por eso `is_storable` era `false`.

## 🆘 Si Sigue Sin Funcionar

1. **Verifica en Odoo UI** que los productos ahora sean "Storable Product"
2. **Ejecuta en shell**:
   ```python
   product = env['product.product'].browse(82)  # ID de un producto
   print(f"Tipo: {product.type}")
   print(f"Is storable: {product.is_storable}")
   print(f"Stock: {product.qty_available}")
   ```

3. **Limpia caché del POS**: Ctrl + Shift + R en el navegador

---

**TL;DR**: Tus productos no son "Storable Products" (almacenables). Ejecuta el script arriba para convertirlos.
