# -*- coding: utf-8 -*-
from odoo import api, models
import logging

_logger = logging.getLogger(__name__)


class ProductProduct(models.Model):
    """Extiende product.product para alertas de stock por variante
    
    Hereda de low_stocks_product_alert y modifica el cálculo de alert_tag
    para que funcione por variante individual cuando las variantes se muestran
    como productos independientes en el POS.
    """

    _inherit = "product.product"

    @api.depends('qty_available')
    def _compute_alert_tag(self):
        """Override: Calcula alert_tag considerando variantes individuales
        
        Solo aplica cuando el módulo pos_product_variants_extended está
        activo y las variantes se muestran como productos independientes.
        """
        # Verificar si la configuración global de alertas está activa
        stock_alert = self.env['ir.config_parameter'].sudo().get_param(
            'low_stocks_product_alert.is_low_stock_alert')
        
        # Verificar si las variantes se muestran independientemente
        show_variants = self.env['ir.config_parameter'].sudo().get_param(
            'pos_product_variants_extended.show_variants_as_products',
            default=False)
        
        if stock_alert and show_variants:
            # Modo variantes: calcular por cada variante individual
            for rec in self:
                # Obtener el umbral mínimo configurado globalmente
                min_stock = int(
                    self.env['ir.config_parameter'].sudo().get_param(
                        'low_stocks_product_alert.min_low_stock_alert',
                        default=0))
                
                # Calcular si esta variante tiene stock bajo
                is_low_stock = (
                    rec.is_storable and
                    rec.qty_available <= min_stock
                )
                
                # Asignar el tag con la cantidad disponible si hay stock bajo
                rec.alert_tag = rec.qty_available if is_low_stock else False
        else:
            # Modo normal: delegar al módulo padre (templates)
            super(ProductProduct, self)._compute_alert_tag()

    @api.model
    def _load_pos_data_fields(self, config_id):
        """Asegurar que alert_tag y qty_available se carguen en el POS"""
        result = super()._load_pos_data_fields(config_id)
        # Agregar campos necesarios para calcular alertas por variante
        if 'alert_tag' not in result:
            result.append('alert_tag')
        if 'qty_available' not in result:
            result.append('qty_available')
        if 'is_storable' not in result:
            result.append('is_storable')
        return result

    @api.model
    def update_stock_after_sale(self, products_data):
        """Actualizar y validar stock después de una venta en POS
        
        Args:
            products_data (list): Lista de diccionarios con:
                - product_id (int): ID del producto
                - qty (float): Cantidad vendida
        
        Returns:
            dict: Resultado de la operación con:
                - success (bool): Si la operación fue exitosa
                - updated_products (list): IDs de productos actualizados
                - warnings (list): Advertencias de stock insuficiente
        """
        try:
            updated_products = []
            warnings = []
            
            for item in products_data:
                product_id = item.get('product_id')
                qty_sold = item.get('qty', 0)
                
                if not product_id or qty_sold <= 0:
                    continue
                
                product = self.browse(product_id)
                
                if not product.exists():
                    warnings.append(
                        f"Producto ID {product_id} no encontrado"
                    )
                    continue
                
                # Verificar si es almacenable
                if not product.is_storable:
                    _logger.info(
                        "Producto %s no es almacenable, omitiendo",
                        product.display_name
                    )
                    continue
                
                # Verificar stock disponible
                current_stock = product.qty_available
                
                if current_stock < qty_sold:
                    warning_msg = (
                        f"ADVERTENCIA: Producto '{product.display_name}' "
                        f"vendió {qty_sold} unidades pero solo tiene "
                        f"{current_stock} en stock"
                    )
                    warnings.append(warning_msg)
                    _logger.warning(warning_msg)
                
                # Recalcular alert_tag después de la venta
                # pylint: disable=protected-access
                product._compute_alert_tag()
                updated_products.append(product_id)
                
                _logger.info(
                    "Stock validado para %s: Vendido=%s, "
                    "Stock actual=%s, Alert=%s",
                    product.display_name,
                    qty_sold,
                    product.qty_available,
                    product.alert_tag
                )
            
            return {
                'success': True,
                'updated_products': updated_products,
                'warnings': warnings,
            }
            
        # pylint: disable=broad-except
        except Exception as error:
            _logger.error(
                "Error actualizando stock después de venta: %s",
                str(error)
            )
            return {
                'success': False,
                'error': str(error),
                'updated_products': [],
                'warnings': [],
            }


