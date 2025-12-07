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
    "summary": """Extiende Product Low Stock Alert para mostrar alertas
    por variantes individuales en el POS""",
    "description": """
    Módulo que extiende low_stocks_product_alert para:
    - Mostrar alertas de stock bajo por variante individual
    - Funciona SOLO cuando las variantes se muestran como productos
      independientes (pos_product_variants_extended activo)
    - Usa el mismo campo alert_tag del módulo base
    - Calcula stock individualmente por variante en lugar de por template
    - Compatible con la arquitectura OWL de Odoo 18

    Características técnicas:
    * Override del método _compute_alert_tag() de product.product
    * Verifica configuración de pos_product_variants_extended
    * Hereda visualización del módulo base low_stocks_product_alert
    * Sin campos adicionales, usa infraestructura existente
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
        "views/product_product_views.xml",
    ],
    "assets": {
        "point_of_sale._assets_pos": [
            # XML deshabilitado - interfiere con botón info del ProductCard
            # "low_stocks_product_alert_variant/static/src/xml/product_item_variant.xml",
            "low_stocks_product_alert_variant/static/src/css/variant_alert.css",
            "low_stocks_product_alert_variant/static/src/js/product_card_patch.js",
            "low_stocks_product_alert_variant/static/src/js/debug_variant_alert.js",
        ],
    },
    "images": ["static/description/icon.png"],
    "license": "LGPL-3",
    "installable": True,
    "application": False,
    "auto_install": False,
}
