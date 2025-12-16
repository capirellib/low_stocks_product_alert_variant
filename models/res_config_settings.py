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
from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    """
    Extiende res.config.settings para agregar configuración de alertas de stock.
    
    Permite configurar:
    - Si las alertas están activas
    - El umbral mínimo de stock para activar alertas
    """
    _inherit = 'res.config.settings'

    is_low_stock_alert = fields.Boolean(
        string="Low Stock Alert",
        help='Activa las alertas de stock bajo. Cuando está habilitado, '
             'los productos con cantidad por debajo del umbral mostrarán '
             'alertas visuales en el POS y en las vistas de backend.',
        config_parameter='low_stocks_product_alert_variant.is_low_stock_alert')
    
    min_low_stock_alert = fields.Integer(
        string='Alert Quantity',
        default=0,
        help='Cantidad mínima de stock. Los productos con stock igual o menor '
             'a este valor mostrarán alertas visuales.',
        config_parameter='low_stocks_product_alert_variant.min_low_stock_alert')
