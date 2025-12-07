# -*- coding: utf-8 -*-
from odoo import api, models


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
