# Low Stock Product Alert - Variant Support

## Descripción

Módulo que extiende `low_stocks_product_alert` para mostrar alertas de 
stock bajo en variantes individuales de productos en Odoo 18 con 
**actualización interactiva en tiempo real**.

**IMPORTANTE:** Este módulo solo funciona cuando las variantes se muestran 
como productos independientes (módulo `pos_product_variants_extended` activo).

## Características

### ✨ Funcionalidades Core

- **Alertas por Variante Individual**: Cada variante muestra su propio 
  stock y alerta
- **Herencia del Módulo Base**: Usa el campo `alert_tag` existente en 
  `low_stocks_product_alert`
- **Activación Condicional**: Solo aplica cuando las variantes se muestran 
  independientemente
- **Sin Campos Adicionales**: Usa la infraestructura existente

### 🎯 Nuevas Funcionalidades Interactivas

#### 1. **Actualización en Tiempo Real**
- 🔄 El badge de stock se actualiza **inmediatamente** al agregar/quitar 
  productos del carrito
- 📊 Muestra el stock disponible real descontando lo que está en el carrito
- 🎨 Animaciones visuales al cambiar cantidades

#### 2. **Feedback Visual Mejorado**
- 🟢 **Verde**: Stock suficiente (> 1.5x umbral mínimo)
- 🟡 **Amarillo con pulso**: Stock bajo (≤ 1.5x umbral mínimo)
- 🔴 **Rojo**: Sin stock disponible
- ✨ Animación de escala al agregar/quitar del carrito
- 🎬 Animación de desaparición cuando se agota el stock

#### 3. **Sincronización con Backend**
- ✅ Al finalizar la venta, se sincroniza el stock con el backend
- 🔄 Actualiza automáticamente los badges después de completar el pago
- 📢 Notificación al usuario confirmando la actualización
- 🧹 Limpieza automática del localStorage después de cada venta

#### 4. **Validación de Stock**
- ⚠️ Valida que haya suficiente stock antes de confirmar la venta
- 📝 Genera advertencias si se vendió más de lo disponible
- 📊 Recalcula automáticamente las alertas después de cada venta

## Dependencias

- `low_stocks_product_alert` (Cybrosys Technologies)
- `pos_product_variants_extended`
- `product`
- `point_of_sale`
- `stock`

## Instalación

1. Asegúrate de tener instalado `low_stocks_product_alert`
2. Asegúrate de tener instalado `pos_product_variants_extended`
3. Copiar el módulo a la carpeta de addons
4. Actualizar lista de aplicaciones en Odoo
5. Instalar "Product Low Stock Alert - Variant Support"

## Configuración

### Activar Alertas de Stock Bajo

1. Ir a **POS > Configuración > Ajustes**
2. Activar "Low Stock Alert"
3. Configurar "Minimum Low Stock Alert" (umbral global)

### Activar Variantes como Productos Independientes

1. Ir a **POS > Configuración > Ajustes**
2. Activar "Show Variants as Products"

## Funcionamiento

### Backend: Cálculo de Alertas por Variante

El módulo override el método `_compute_alert_tag()` para:

1. Verificar si las alertas globales están activas
2. Verificar si las variantes se muestran como productos independientes
3. Calcular `alert_tag` por cada variante (no por template)
4. Mostrar la cantidad disponible en el badge de alerta

### Frontend: Sistema Interactivo

#### 1. **Detección de Cambios en el Carrito** (`order_patch.js`)
```javascript
// Detecta automáticamente:
- Agregar producto (add_product)
- Cambiar cantidad (set_quantity)
- Eliminar línea (remove_orderline)
- Montar/desmontar líneas (onMounted/onWillUnmount)
```

#### 2. **Actualización de Badges** (`product_card_patch.js`)
```javascript
// Al cambiar el carrito:
- Calcula stock disponible = stock real - cantidad en carrito
- Actualiza badge con animación
- Cambia color según nivel de stock
- Muestra feedback visual inmediato
```

#### 3. **Sincronización al Pagar** (`payment_screen_patch.js`)
```javascript
// Al completar la venta:
1. Captura productos vendidos
2. Valida el pedido
3. Sincroniza stock con backend
4. Recarga datos de productos
5. Limpia localStorage
6. Notifica al usuario
```

### Flujo Completo del Sistema

```
Usuario agrega producto
         ↓
order_patch detecta cambio
         ↓
Actualiza localStorage
         ↓
Emite evento pos_cart_updated
         ↓
product_card_patch recibe evento
         ↓
Calcula stock disponible
         ↓
Actualiza badge con animación
         ↓
Usuario ve stock actualizado

... (vende productos) ...

Usuario finaliza pago
         ↓
payment_screen_patch captura venta
         ↓
Llama a backend: update_stock_after_sale()
         ↓
Backend valida y recalcula alertas
         ↓
Frontend recarga stock de productos
         ↓
Limpia carrito y localStorage
         ↓
Notifica usuario: "Stock actualizado"
```

## Uso en POS

### Badges de Stock Dinámicos

- 🟢 **Stock Suficiente**: Verde con ✓
- 🟡 **Stock Bajo**: Amarillo con pulso de advertencia
- 🔴 **Sin Stock**: Rojo (heredado del módulo base)

### Animaciones

- **Al agregar al carrito**: Escala y reduce (badge-decrease)
- **Al quitar del carrito**: Escala y aumenta (badge-increase)
- **Al agotar stock**: Desaparece suavemente (badge-removing)
- **Stock bajo**: Pulso continuo (badge-pulse)

## Campos Técnicos

### product.product

- `alert_tag`: Char (heredado de `low_stocks_product_alert`) - 
  Muestra cantidad si hay stock bajo
- `qty_available`: Float - Stock disponible en tiempo real
- `is_storable`: Boolean - Indica si el producto es almacenable

### Métodos Backend

#### `update_stock_after_sale(products_data)`
Sincroniza y valida stock después de una venta.

**Args:**
- `products_data` (list): Lista de diccionarios con `product_id` y `qty`

**Returns:**
```python
{
    'success': True,
    'updated_products': [1, 2, 3],
    'warnings': []
}
```

## Archivos del Módulo

### Backend (Python)
- `models/product_product.py`: Lógica de cálculo de alertas y sincronización

### Frontend (JavaScript)
- `static/src/js/product_card_patch.js`: Actualización de badges en tiempo real
- `static/src/js/order_patch.js`: Detección de cambios en el carrito
- `static/src/js/payment_screen_patch.js`: Sincronización al finalizar venta

### Estilos (CSS)
- `static/src/css/variant_alert.css`: Animaciones y estilos de badges

### product.product

- `alert_tag`: Char (heredado de `low_stocks_product_alert`) - 
  Muestra cantidad si hay stock bajo

## Implementación Técnica

```python
@api.depends('qty_available')
def _compute_alert_tag(self):
    # Override que verifica:
    # 1. Alertas globales activas
    # 2. Variantes mostradas independientemente
    # 3. Calcula por variante o delega al padre
```

## Autor

**Betta ERP - Carlos Esteban Pirelli B**

- Web: https://bettaerp.com
- Corrientes, Argentina

## Licencia

LGPL-3
