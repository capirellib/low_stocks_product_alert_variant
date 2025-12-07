/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { Component, useState, onWillStart } from "@odoo/owl";

console.log("🔥 [low_stocks_product_alert_variant] Componente de alertas cargado");

// Patch para agregar badge de alerta de stock bajo
patch(ProductCard.prototype, {
    setup() {
        super.setup(...arguments);
        this.pos = usePos();
    },
    
    get hasLowStockAlert() {
        const product = this.props.product;
        return product.alert_tag && product.alert_tag !== false;
    },
    
    get alertTagValue() {
        const product = this.props.product;
        return product.alert_tag || '';
    }
});

// Agregar template dinámicamente
patch(ProductCard, {
    template: `
        <t t-inherit="point_of_sale.ProductCard" t-inherit-mode="extension" owl="1">
            <xpath expr="//div[hasclass('product-img')]" position="inside">
                <t t-if="hasLowStockAlert">
                    <span class="alert_tag position-absolute top-0 start-0 translate-middle"
                          style="background-color: #a1dafc; margin-left: 20%; margin-top: 9%; padding: 1px 10px; border-radius: 5px;">
                        <i class="fa fa-warning text-danger" style="padding-right: 5px;"/>
                        <t t-esc="alertTagValue"/>
                    </span>
                </t>
            </xpath>
        </t>
    `
});

console.log("✅ [low_stocks_product_alert_variant] Patch de ProductCard aplicado");
