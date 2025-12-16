# Unificación del Módulo de Alertas de Stock

## Resumen de Cambios

Este módulo ahora es **completamente independiente** y ya no depende de `low_stocks_product_alert` de Cybrosys. Toda la funcionalidad ha sido integrada y mejorada.

## ¿Qué se Unificó?

### 1. **Modelos Agregados**

#### `models/product_template.py` (NUEVO)
- Campo `alert_state`: Indica si el template tiene stock bajo
- Campo `color_field`: Color de fondo para vistas kanban
- Método `_compute_alert_state()`: Calcula alertas a nivel template

#### `models/res_config_settings.py` (NUEVO)
- Campo `is_low_stock_alert`: Activa/desactiva alertas globalmente
- Campo `min_low_stock_alert`: Umbral mínimo de stock
- Parámetros de configuración: `low_stocks_product_alert_variant.*`

#### `models/product_product.py` (ACTUALIZADO)
- Mantiene campo `alert_tag` con cantidad disponible
- Método `_compute_alert_tag()` mejorado con doble modo:
  - **Modo variantes**: Cuando `pos_product_variants_extended` está activo
  - **Modo template**: Cuando se trabaja con productos estándar
- Método `_load_pos_data_fields()`: Carga campos en POS
- Método `update_stock_after_sale()`: Actualiza stock después de ventas

### 2. **Vistas Agregadas**

#### `views/res_config_settings_views.xml` (NUEVO)
- Configuración en Settings > Inventory > Low Stock Alert
- Toggle para activar/desactivar alertas
- Campo numérico para cantidad mínima

#### `views/product_template_views.xml` (NUEVO)
- Vista tree: Decoración roja para templates con stock bajo
- Vista kanban: Color de fondo dinámico según stock

#### `views/product_product_views.xml` (ACTUALIZADO)
- Ya no depende de referencias externas
- Vista form: Muestra campo `alert_tag`
- Vista tree: Decoración roja y campos de alerta

### 3. **Assets Actualizados**

#### CSS (`static/src/css/variant_alert.css`)
- **Agregado**: Estilos base del módulo original
  - `.text-danger td`: Color de fondo para filas con alerta
  - `.d-color`: Color de alerta
- **Mantenido**: Estilos de variantes y animaciones

#### XML POS (`static/src/xml/product_item_variant.xml`)
- Template para mostrar badge de stock en ProductCard
- Compatible con ambos modos (template/variante)

#### JavaScript (sin cambios)
- `order_patch.js`: Manejo de órdenes
- `product_card_patch.js`: Parches para tarjetas de producto
- `payment_screen_patch.js`: Pantalla de pago

### 4. **Manifest Actualizado**

**Dependencias ELIMINADAS:**
- ❌ `low_stocks_product_alert` (ya no necesaria)
- ✅ Opcional: `pos_product_variants_extended` (solo si usas variantes)

**Dependencias MÍNIMAS:**
- `product`
- `point_of_sale`
- `stock`

**Data files agregados:**
- `views/res_config_settings_views.xml`
- `views/product_template_views.xml`

**Assets actualizados:**
- Agregado CSS a `web.assets_backend`
- Habilitado XML template en POS

## Funcionalidades Unificadas

### Backend (Odoo)

1. **Configuración Global**
   - Settings > Inventory > Low Stock Alert
   - Activar/desactivar alertas
   - Definir cantidad mínima

2. **Vista de Productos (Templates)**
   - Tree: Filas rojas para stock bajo
   - Kanban: Fondo coloreado según stock
   - Campos computados automáticamente

3. **Vista de Variantes (Products)**
   - Igual que templates
   - Alert tag visible en form y tree

### POS (Point of Sale)

1. **Badge de Stock**
   - Muestra cantidad disponible
   - Solo visible cuando stock ≤ umbral
   - Color y estilo distintivo

2. **Modos de Operación**
   - **Sin pos_product_variants_extended**: Alertas por template
   - **Con pos_product_variants_extended**: Alertas por variante individual

3. **Animaciones y Feedback**
   - Actualización en tiempo real
   - Animaciones al agregar/quitar del carrito

## Parámetros de Configuración

Los parámetros ahora usan el prefijo del módulo actual:

```python
# Nuevos parámetros (usar estos)
'low_stocks_product_alert_variant.is_low_stock_alert'
'low_stocks_product_alert_variant.min_low_stock_alert'

# Parámetros antiguos (ya no se usan)
'low_stocks_product_alert.is_low_stock_alert'
'low_stocks_product_alert.min_low_stock_alert'
```

## Migración

### Si tenías el módulo base instalado:

1. **Backup de la base de datos**
2. **Desinstalar** `low_stocks_product_alert`
3. **Actualizar** este módulo
4. **Reconfigurar** en Settings > Inventory
5. **Recalcular** campos computados:
   ```python
   # En shell de Odoo
   env['product.template'].search([])._compute_alert_state()
   env['product.product'].search([])._compute_alert_tag()
   ```

### Si empiezas desde cero:

1. Instalar este módulo
2. Configurar en Settings > Inventory
3. ¡Listo!

## Ventajas de la Unificación

✅ **Independencia**: No depende de módulos de terceros  
✅ **Simplicidad**: Todo en un solo módulo  
✅ **Flexibilidad**: Funciona con y sin variantes  
✅ **Mantenibilidad**: Código bajo tu control  
✅ **Configuración única**: Un solo lugar para configurar  
✅ **Sin conflictos**: No hay duplicación de funcionalidad  

## Estructura Final del Módulo

```
low_stocks_product_alert_variant/
├── __init__.py
├── __manifest__.py (actualizado)
├── README.md
├── doc/
│   ├── MEJORAS_IMPLEMENTADAS.md
│   └── UNIFICACION.md (este archivo)
├── models/
│   ├── __init__.py (actualizado)
│   ├── product_product.py (actualizado)
│   ├── product_template.py (nuevo)
│   └── res_config_settings.py (nuevo)
├── views/
│   ├── product_product_views.xml (actualizado)
│   ├── product_template_views.xml (nuevo)
│   └── res_config_settings_views.xml (nuevo)
└── static/
    └── src/
        ├── css/
        │   └── variant_alert.css (actualizado)
        ├── js/
        │   ├── order_patch.js
        │   ├── payment_screen_patch.js
        │   └── product_card_patch.js
        └── xml/
            └── product_item_variant.xml
```

## Próximos Pasos

1. **Probar** en entorno de desarrollo
2. **Verificar** configuración en Settings
3. **Validar** alertas en backend (tree/kanban)
4. **Validar** badges en POS
5. **Probar** con y sin pos_product_variants_extended

---

**Fecha de unificación**: 15 de diciembre de 2025  
**Versión**: 18.0.2.0.0  
**Autor**: Betta ERP - Carlos Esteban Pirelli B
