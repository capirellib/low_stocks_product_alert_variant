# Low Stock Product Alert - Variant Support

## Descripción

Módulo que extiende `low_stocks_product_alert` para mostrar alertas de 
stock bajo en variantes individuales de productos en Odoo 18.

**IMPORTANTE:** Este módulo solo funciona cuando las variantes se muestran 
como productos independientes (módulo `pos_product_variants_extended` activo).

## Características

- **Alertas por Variante Individual**: Cada variante muestra su propio 
  stock y alerta
- **Herencia del Módulo Base**: Usa el campo `alert_tag` existente en 
  `low_stocks_product_alert`
- **Activación Condicional**: Solo aplica cuando las variantes se muestran 
  independientemente
- **Integración con POS**: Muestra alertas visuales heredadas del módulo base
- **Sin Campos Adicionales**: Usa la infraestructura existente

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

### Cuando las Variantes se Muestran Independientemente

El módulo override el método `_compute_alert_tag()` para:

1. Verificar si las alertas globales están activas
2. Verificar si las variantes se muestran como productos independientes
3. Calcular `alert_tag` por cada variante (no por template)
4. Mostrar la cantidad disponible en el badge de alerta

### Cuando las Variantes NO se Muestran Independientemente

El módulo delega al comportamiento del módulo base 
`low_stocks_product_alert`, calculando alertas por template.

## Uso en POS

Las variantes con stock bajo mostrarán (heredado de 
`low_stocks_product_alert`):

- 🔴 Badge con icono de advertencia y cantidad disponible
- 📊 Fondo azul claro (`#a1dafc`)
- ⚠️ Icono de advertencia en rojo

## Campos Técnicos

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
