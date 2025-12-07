# Low Stock Product Alert - Variant Support

## Descripción

Módulo que extiende `low_stocks_product_alert` para proporcionar alertas de stock bajo específicas por variante de producto en Odoo 18.

## Características

- **Alertas por Variante**: Cada variante puede tener su propio umbral de stock bajo
- **Integración con POS**: Muestra alertas visuales en el punto de venta
- **Compatible con Variantes Extendidas**: Funciona con `pos_product_variants_extended`
- **Configuración Flexible**: Hereda configuración del template o usa configuración específica

## Dependencias

- `low_stocks_product_alert`
- `pos_product_variants_extended`
- `product`
- `point_of_sale`
- `stock`

## Instalación

1. Copiar el módulo a la carpeta de addons
2. Actualizar lista de aplicaciones en Odoo
3. Instalar "Product Low Stock Alert - Variant Support"

## Configuración

### Por Variante

1. Ir a **Inventario > Productos > Productos**
2. Seleccionar una variante específica
3. En la pestaña "Low Stock Alert (Variant Specific)":
   - Activar "Alert on Low Stock (Variant)"
   - Configurar "Variant Stock Threshold"

### Herencia del Template

Si no se configura específicamente, la variante hereda:

- `low_stock_alert` del template padre
- `stock_threshold` del template padre

## Uso en POS

Las variantes con stock bajo mostrarán:

- 🔴 Badge "⚠️ Stock Bajo" en la esquina superior derecha
- 🟠 Borde rojo alrededor de la tarjeta de producto
- 📊 Información de stock disponible en la parte inferior

## Campos Técnicos

### product.product

- `low_stock_alert_variant`: Boolean - Activar alerta para esta variante
- `variant_stock_threshold`: Float - Umbral de stock para esta variante
- `is_low_stock_variant`: Boolean (computed) - Indica si tiene stock bajo

## Autor

**Betta ERP - Carlos Esteban Pirelli B**

- Web: https://bettaerp.com
- Corrientes, Argentina

## Licencia

LGPL-3
