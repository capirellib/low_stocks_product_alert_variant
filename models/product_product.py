# -*- coding: utf-8 -*-
#############################################################################
#
#    Betta ERP - Carlos Esteban Pirelli B
#
#    Copyright (C) 2024-TODAY Betta ERP(<https://bettaerp.com>)
#    Author: Carlos Esteban Pirelli B
#
#    You can modify it under the terms of the GNU LESSER
#    GENERAL PUBLIC LICENSE (LGPL v3), Version 3.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU LESSER GENERAL PUBLIC LICENSE (LGPL v3) for more details.
#
#    You should have received a copy of the GNU LESSER GENERAL PUBLIC LICENSE
#    (LGPL v3) along with this program.
#    If not, see <http://www.gnu.org/licenses/>.
#
#############################################################################
from odoo import api, fields, models
import logging

_logger = logging.getLogger(__name__)


class ProductProduct(models.Model):
    """
    Extiende product.product para agregar alertas de stock.
    
    Implementa alertas de stock bajo que funcionan:
    - Por variante individual (cuando pos_product_variants_extended está activo)
    - Por template (modo estándar)
    
    Añade campo computado alert_tag que muestra la cantidad disponible
    cuando el producto está por debajo del umbral configurado.
    """
    _inherit = 'product.product'

    alert_tag = fields.Char(
        string='Product Alert Tag',
        compute='_compute_alert_tag',
        help='Muestra la cantidad disponible cuando hay stock bajo')
    
    alert_state = fields.Boolean(
        string='Product Alert State',
        compute='_compute_alert_tag',
        help='Indica si el producto tiene stock bajo')

    @api.depends('qty_available')
    def _compute_alert_tag(self):
        """
        Calcula el tag de alerta basado en el stock disponible.
        
        Comportamiento:
        - Si pos_product_variants_extended está activo: calcula por variante
        - Si no: calcula por template (comportamiento estándar)
        
        Muestra la cantidad disponible como tag si está bajo el umbral.
        """
        # Verificar si la configuración global de alertas está activa
        stock_alert = self.env['ir.config_parameter'].sudo().get_param(
            'low_stocks_product_alert_variant.is_low_stock_alert')
        
        if not stock_alert:
            # Si las alertas están desactivadas, no mostrar ningún tag
            for rec in self:
                rec.alert_tag = False
                rec.alert_state = False
            return
        
        # Obtener el umbral mínimo configurado
        min_stock = int(
            self.env['ir.config_parameter'].sudo().get_param(
                'low_stocks_product_alert_variant.min_low_stock_alert',
                default=0))
        
        # Verificar si las variantes se muestran independientemente
        show_variants = self.env['ir.config_parameter'].sudo().get_param(
            'pos_product_variants_extended.show_variants_as_products',
            default=False)
        
        if show_variants:
            # Modo variantes: calcular por cada variante individual
            for rec in self:
                # Calcular si esta variante tiene stock bajo
                is_low_stock = (
                    rec.is_storable and
                    rec.qty_available <= min_stock
                )
                
                # Asignar el tag con la cantidad disponible si hay stock bajo
                rec.alert_tag = str(int(rec.qty_available)) if is_low_stock else False
                rec.alert_state = is_low_stock
        else:
            # Modo normal: calcular por template (igual que módulo base)
            for rec in self:
                is_low_stock = (
                    rec.is_storable and
                    rec.qty_available <= min_stock
                )
                rec.alert_tag = str(int(rec.qty_available)) if is_low_stock else False
                rec.alert_state = is_low_stock

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


