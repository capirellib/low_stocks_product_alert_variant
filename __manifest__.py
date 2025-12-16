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
    "name": "Product Low Stock Alert - Complete",
    "version": "18.0.2.0.0",
    "category": "Warehouse,Point of Sale",
    "summary": """Sistema completo de alertas de stock bajo para productos
    y variantes en POS y vistas backend""",
    "description": """
    Módulo unificado de alertas de stock bajo que incluye:
    - Alertas de stock bajo por template y por variantes individuales
    - Visualización en POS con badges de stock
    - Alertas visuales en vistas kanban y tree del backend
    - Configuración de umbral mínimo de stock
    - Soporte para variantes cuando pos_product_variants_extended está activo
    - Compatible con la arquitectura OWL de Odoo 18

    Características técnicas:
    * Campos computados alert_tag y alert_state en product.product y product.template
    * Configuración global en Settings > Inventory
    * Detección automática de modo variantes/templates
    * Visualización con colores y badges en POS
    * Sin necesidad de módulos adicionales (excepto pos_product_variants_extended 
      si se desea trabajar con variantes individuales)
    
    Funcionalidad unificada:
    - Incluye toda la funcionalidad del módulo base low_stocks_product_alert
    - Extiende con soporte completo para variantes individuales
    - No requiere instalación de módulos adicionales de terceros
    """,
    "author": "Betta ERP - Corrientes, Argentina",
    "company": "Betta ERP",
    "maintainer": "Betta ERP",
    "website": "https://bettaerp.com",
    "depends": [
        "product",
        "point_of_sale",
        "stock",
    ],
    "data": [
        "views/res_config_settings_views.xml",
        "views/product_product_views.xml",
        "views/product_template_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "low_stocks_product_alert_variant/static/src/css/variant_alert.css",
        ],
        "point_of_sale._assets_pos": [
            "low_stocks_product_alert_variant/static/src/xml/product_item_variant.xml",
            "low_stocks_product_alert_variant/static/src/css/variant_alert.css",
            "low_stocks_product_alert_variant/static/src/js/order_patch.js",
            "low_stocks_product_alert_variant/static/src/js/product_card_patch.js",
            "low_stocks_product_alert_variant/static/src/js/payment_screen_patch.js",
        ],
    },
    "images": ["static/description/icon.png"],
    "license": "LGPL-3",
    "installable": True,
    "application": False,
    "auto_install": False,
}
