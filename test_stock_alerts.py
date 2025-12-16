# -*- coding: utf-8 -*-
"""
Script de prueba para verificar las alertas de stock

Ejecutar en shell de Odoo:
$ odoo shell -d tu_base_de_datos

>>> exec(open('/ruta/al/test_stock_alerts.py').read())
"""

def test_stock_alerts(env):
    """Prueba las alertas de stock"""
    
    print("\n" + "="*60)
    print("DIAGNÓSTICO DE ALERTAS DE STOCK")
    print("="*60 + "\n")
    
    # 1. Verificar parámetros de configuración
    print("1. CONFIGURACIÓN:")
    print("-" * 40)
    
    is_enabled = env['ir.config_parameter'].sudo().get_param(
        'low_stocks_product_alert_variant.is_low_stock_alert')
    min_stock = env['ir.config_parameter'].sudo().get_param(
        'low_stocks_product_alert_variant.min_low_stock_alert', default='0')
    
    print(f"   Alertas habilitadas: {is_enabled}")
    print(f"   Stock mínimo: {min_stock}")
    
    if not is_enabled:
        print("\n   ⚠️  PROBLEMA: Las alertas NO están habilitadas!")
        print("   Solución: Ir a Settings > Inventory > Low Stock Alert")
        print("   y activar la opción\n")
        return
    
    # 2. Verificar productos con stock
    print("\n2. PRODUCTOS CON STOCK:")
    print("-" * 40)
    
    products = env['product.product'].search([
        ('is_storable', '=', True),
        ('qty_available', '>', 0)
    ], limit=5)
    
    if not products:
        print("   ⚠️  No se encontraron productos almacenables con stock")
        return
    
    for product in products:
        product._compute_alert_tag()
        print(f"\n   Producto: {product.display_name}")
        print(f"   - ID: {product.id}")
        print(f"   - Stock disponible: {product.qty_available}")
        print(f"   - Es almacenable: {product.is_storable}")
        print(f"   - Alert tag: {product.alert_tag}")
        print(f"   - Alert state: {product.alert_state}")
        
        if product.qty_available <= int(min_stock):
            print(f"   ✅ DEBERÍA mostrar alerta (stock <= {min_stock})")
        else:
            print(f"   ℹ️  NO debería mostrar alerta (stock > {min_stock})")
    
    # 3. Verificar productos con alerta activa
    print("\n3. PRODUCTOS CON ALERTA ACTIVA:")
    print("-" * 40)
    
    products_with_alert = env['product.product'].search([
        ('is_storable', '=', True),
        ('qty_available', '<=', int(min_stock))
    ], limit=5)
    
    if not products_with_alert:
        print(f"   ℹ️  No hay productos con stock <= {min_stock}")
    else:
        print(f"   Se encontraron {len(products_with_alert)} productos:")
        for product in products_with_alert:
            product._compute_alert_tag()
            print(f"\n   - {product.display_name}")
            print(f"     Stock: {product.qty_available}")
            print(f"     Alert tag: '{product.alert_tag}'")
            print(f"     Alert state: {product.alert_state}")
    
    # 4. Verificar campos POS
    print("\n4. CAMPOS CARGADOS EN POS:")
    print("-" * 40)
    
    pos_configs = env['pos.config'].search([], limit=1)
    if pos_configs:
        config = pos_configs[0]
        product_model = env['product.product']
        fields = product_model._load_pos_data_fields(config.id)
        
        required_fields = ['alert_tag', 'qty_available', 'is_storable']
        print(f"   Campos requeridos:")
        for field in required_fields:
            status = "✅" if field in fields else "❌"
            print(f"   {status} {field}")
    else:
        print("   ⚠️  No se encontró ninguna configuración de POS")
    
    print("\n" + "="*60)
    print("FIN DEL DIAGNÓSTICO")
    print("="*60 + "\n")


# Si se ejecuta directamente en shell
if __name__ == '__main__' or 'env' in globals():
    try:
        test_stock_alerts(env)
    except NameError:
        print("Este script debe ejecutarse en el shell de Odoo")
        print("Uso: odoo shell -d tu_base_de_datos")
        print("Luego: exec(open('test_stock_alerts.py').read())")
