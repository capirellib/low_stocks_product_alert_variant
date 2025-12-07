# -*- coding: utf-8 -*-
from odoo import api, fields, models


class ProductProduct(models.Model):
    """Extiende product.product para alertas de stock por variante"""

    _inherit = "product.product"

    low_stock_alert_variant = fields.Boolean(
        string="Alert on Low Stock (Variant)",
        help="Show alert when this specific variant has low stock",
        default=False,
    )

    variant_stock_threshold = fields.Float(
        string="Variant Stock Threshold",
        help="Minimum stock quantity for this variant before alert",
        default=0.0,
    )

    @api.depends("qty_available", "variant_stock_threshold")
    def _compute_is_low_stock_variant(self):
        """Calcula si la variante tiene stock bajo"""
        for product in self:
            if product.low_stock_alert_variant and product.variant_stock_threshold > 0:
                product.is_low_stock_variant = (
                    product.qty_available <= product.variant_stock_threshold
                )
            else:
                # Heredar del template si no está configurado
                product.is_low_stock_variant = (
                    product.product_tmpl_id.low_stock_alert
                    and product.qty_available <= product.product_tmpl_id.stock_threshold
                )

    is_low_stock_variant = fields.Boolean(
        string="Is Low Stock (Variant)",
        compute="_compute_is_low_stock_variant",
        store=True,
        help="Technical field indicating if this variant has low stock",
    )

    def _get_stock_info_for_pos(self):
        """
        Retorna información de stock para el POS
        Override para incluir información específica de variante
        """
        self.ensure_one()
        return {
            "product_id": self.id,
            "display_name": self.display_name,
            "qty_available": self.qty_available,
            "is_low_stock": self.is_low_stock_variant,
            "stock_threshold": self.variant_stock_threshold
            or self.product_tmpl_id.stock_threshold,
            "low_stock_alert_enabled": self.low_stock_alert_variant
            or self.product_tmpl_id.low_stock_alert,
        }
