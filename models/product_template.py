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


class ProductTemplate(models.Model):
    """
    Extiende product.template para agregar alertas de stock bajo.
    
    Añade campos computados para el estado de alerta y color de fondo
    basados en la cantidad disponible del producto y el umbral configurado.
    """
    _inherit = 'product.template'

    alert_state = fields.Boolean(
        string='Product Alert State',
        compute='_compute_alert_state',
        help='Indica si el producto tiene stock bajo')
    
    color_field = fields.Char(
        string='Background color',
        help='Color de fondo para visualización en vistas kanban/tree')

    @api.depends('qty_available')
    def _compute_alert_state(self):
        """Calcula el estado de alerta y color basado en el stock disponible.
        
        Compara la cantidad disponible con el umbral mínimo configurado
        en los parámetros del sistema.
        """
        stock_alert = self.env['ir.config_parameter'].sudo().get_param(
            'low_stocks_product_alert_variant.is_low_stock_alert')
        
        for rec in self:
            if stock_alert:
                min_stock = int(
                    rec.env['ir.config_parameter'].sudo().get_param(
                        'low_stocks_product_alert_variant.min_low_stock_alert',
                        default=0))
                
                # Solo alertar si es almacenable y está bajo el mínimo
                if not rec.is_storable or rec.qty_available > min_stock:
                    rec.alert_state = False
                    rec.color_field = 'white'
                else:
                    rec.alert_state = True
                    rec.color_field = '#fdc6c673'
            else:
                rec.alert_state = False
                rec.color_field = 'white'
