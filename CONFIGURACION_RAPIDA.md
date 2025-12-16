# Product Low Stock Alert - Complete

## 🚀 CONFIGURACIÓN RÁPIDA

### PASO 1: Activar las Alertas

1. Ve a **Settings → Inventory → Operations**
2. Busca **"Low Stock Alert"**
3. ✅ **ACTIVA** la casilla "Low Stock Alert"
4. Configura **"Alert Quantity"** (ej: 5)
5. **GUARDAR**

### PASO 2: Verificar

Abre el shell de Odoo y ejecuta:

```python
# Verificar configuración
print(env['ir.config_parameter'].sudo().get_param('low_stocks_product_alert_variant.is_low_stock_alert'))
# Debe imprimir: True

print(env['ir.config_parameter'].sudo().get_param('low_stocks_product_alert_variant.min_low_stock_alert'))
# Debe imprimir: 5 (o el número que configuraste)

# Prueba con un producto
product = env['product.product'].search([('is_storable', '=', True)], limit=1)
product._compute_alert_tag()
print(f"Producto: {product.display_name}")
print(f"Stock: {product.qty_available}")
print(f"Alert tag: {product.alert_tag}")
```

### PASO 3: Recalcular (si es necesario)

```python
# Recalcular todos los productos
env['product.template'].search([])._compute_alert_state()
env['product.product'].search([])._compute_alert_tag()
env.cr.commit()
```

---

## ❓ PROBLEMAS COMUNES

### 🔴 No veo alertas en el POS

**Checklist:**

1. ✅ **¿Está activada la configuración?**
   - Settings → Inventory → Low Stock Alert → **ACTIVAR**

2. ✅ **¿El producto es almacenable?**
   ```python
   product = env['product.product'].browse(TU_PRODUCTO_ID)
   print(f"Es almacenable: {product.is_storable}")
   # Debe ser True
   ```

3. ✅ **¿El stock es menor o igual al umbral?**
   ```python
   min_stock = int(env['ir.config_parameter'].sudo().get_param(
       'low_stocks_product_alert_variant.min_low_stock_alert', default=0))
   print(f"Stock: {product.qty_available}, Mínimo: {min_stock}")
   # El stock debe ser <= mínimo para que aparezca la alerta
   ```

4. ✅ **¿El campo alert_tag tiene valor?**
   ```python
   product._compute_alert_tag()
   print(f"Alert tag: '{product.alert_tag}'")
   # Debe mostrar un número, no False o None
   ```

5. ✅ **¿Limpiaste la caché del navegador?**
   - Presiona Ctrl+Shift+R (o Cmd+Shift+R en Mac)
   - O abre en modo incógnito

6. ✅ **¿Reiniciaste Odoo después de actualizar?**
   ```bash
   docker restart odoo18-web
   # o
   sudo systemctl restart odoo
   ```

### 🔴 No veo alertas en vistas backend

```python
# Verificar un template
template = env['product.template'].browse(TU_TEMPLATE_ID)
template._compute_alert_state()
print(f"Alert state: {template.alert_state}")
print(f"Color: {template.color_field}")
```

### 🔴 Script de diagnóstico completo

```python
# Pega este código completo en el shell de Odoo

print("\n" + "="*60)
print("DIAGNÓSTICO DE ALERTAS DE STOCK")
print("="*60)

# 1. Configuración
is_enabled = env['ir.config_parameter'].sudo().get_param(
    'low_stocks_product_alert_variant.is_low_stock_alert')
min_stock = env['ir.config_parameter'].sudo().get_param(
    'low_stocks_product_alert_variant.min_low_stock_alert', default='0')

print(f"\n1. CONFIGURACIÓN:")
print(f"   Alertas habilitadas: {is_enabled}")
print(f"   Stock mínimo: {min_stock}")

if is_enabled != 'True':
    print("\n   ⚠️  ERROR: Las alertas NO están habilitadas!")
    print("   Ve a: Settings → Inventory → Low Stock Alert")
else:
    print("   ✅ Alertas habilitadas correctamente")

# 2. Probar con productos reales
products = env['product.product'].search([
    ('is_storable', '=', True),
], limit=5, order='qty_available')

print(f"\n2. PRODUCTOS DE PRUEBA (primeros 5 con menos stock):")
for product in products:
    product._compute_alert_tag()
    symbol = "⚠️" if product.alert_tag else "✅"
    print(f"\n   {symbol} {product.display_name}")
    print(f"      Stock: {product.qty_available}")
    print(f"      Alert tag: '{product.alert_tag}'")
    print(f"      Alert state: {product.alert_state}")
    
    if product.qty_available <= int(min_stock):
        if product.alert_tag:
            print(f"      ✅ CORRECTO: Muestra alerta")
        else:
            print(f"      ❌ ERROR: Debería mostrar alerta pero no lo hace")

print("\n" + "="*60 + "\n")
```

---

## 📖 Documentación Completa

Ver: [README.md](README.md) para documentación completa

---

## 🛠️ COMANDOS ÚTILES

### Forzar recálculo de un producto específico
```python
product = env['product.product'].browse(PRODUCT_ID)
product._compute_alert_tag()
print(f"Alert tag: {product.alert_tag}")
```

### Ver todos los productos con alerta
```python
min_stock = int(env['ir.config_parameter'].sudo().get_param(
    'low_stocks_product_alert_variant.min_low_stock_alert', default=0))

products = env['product.product'].search([
    ('is_storable', '=', True),
    ('qty_available', '<=', min_stock)
])

for p in products:
    p._compute_alert_tag()
    print(f"{p.display_name}: Stock={p.qty_available}, Alert='{p.alert_tag}'")
```

### Activar alertas desde código
```python
env['ir.config_parameter'].sudo().set_param(
    'low_stocks_product_alert_variant.is_low_stock_alert', 'True')
env['ir.config_parameter'].sudo().set_param(
    'low_stocks_product_alert_variant.min_low_stock_alert', '5')
env.cr.commit()
print("✅ Alertas activadas con umbral de 5 unidades")
```

---

**Autor:** Betta ERP  
**Versión:** 18.0.2.0.0  
**Fecha:** 15/12/2025
