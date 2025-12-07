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
{
    "name": "Product Low Stock Alert - Variant Support",
    "version": "18.0.1.0.0",
    "category": "Warehouse,Point of Sale",
    "summary": """Extiende Product Low Stock Alert para soportar variantes 
    de producto mostradas individualmente en el POS""",
    "description": """
    Módulo que extiende low_stocks_product_alert para:
    - Mostrar alertas de stock bajo por variante individual
    - Integración con pos_product_variants_extended
    - Alertas específicas por variante en lugar de por template
    - Visualización mejorada de stock por variante en POS
    
    Características técnicas:
    * Hereda de low_stocks_product_alert
    * Compatible con pos_product_variants_extended
    * Calcula stock individualmente por variante
    * Alertas visuales por cada variante en POS
    * Compatible con arquitectura OWL de Odoo 18
    """,
    "author": "Betta ERP - Corrientes, Argentina",
    "company": "Betta ERP",
    "maintainer": "Betta ERP",
    "website": "https://bettaerp.com",
    "depends": [
        "low_stocks_product_alert",
        "pos_product_variants_extended",
        "product",
        "point_of_sale",
        "stock",
    ],
    "data": [
        "security/ir.model.access.csv",
        "views/product_product_views.xml",
    ],
    "assets": {
        "point_of_sale.assets": [
            "low_stocks_product_alert_variant/static/src/xml/product_item_variant.xml",
            "low_stocks_product_alert_variant/static/src/css/variant_alert.css",
        ],
    },
    "images": ["static/description/icon.png"],
    "license": "LGPL-3",
    "installable": True,
    "application": False,
    "auto_install": False,
}
