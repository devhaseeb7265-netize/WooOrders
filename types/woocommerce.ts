export type WCOrderStatus =
  | "pending"
  | "processing"
  | "on-hold"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed"
  | "trash";

export interface WCMetaData {
  readonly id?: number;
  readonly key: string;
  readonly value: string | number | boolean | Record<string, unknown> | Array<unknown>;
  readonly display_key?: string;
  readonly display_value?: string;
}

export interface WCAddress {
  readonly first_name: string;
  readonly last_name: string;
  readonly company?: string;
  readonly address_1: string;
  readonly address_2?: string;
  readonly city: string;
  readonly state: string;
  readonly postcode: string;
  readonly country: string;
  readonly email?: string;
  readonly phone?: string;
}

export interface WCTaxLine {
  readonly id: number;
  readonly rate_code: string;
  readonly rate_id: number;
  readonly label: string;
  readonly compound: boolean;
  readonly tax_total: string;
  readonly shipping_tax_total: string;
  readonly meta_data?: readonly WCMetaData[];
}

export interface WCShippingLine {
  readonly id: number;
  readonly method_title: string;
  readonly method_id: string;
  readonly total: string;
  readonly total_tax: string;
  readonly meta_data?: readonly WCMetaData[];
}

export interface WCFeeLine {
  readonly id: number;
  readonly name: string;
  readonly tax_class?: string;
  readonly tax_status?: string;
  readonly total: string;
  readonly total_tax?: string;
  readonly meta_data?: readonly WCMetaData[];
}

export interface WCCouponLine {
  readonly id: number;
  readonly code: string;
  readonly discount: string;
  readonly discount_tax?: string;
  readonly meta_data?: readonly WCMetaData[];
}

export interface WCLineItem {
  readonly id: number;
  readonly name: string;
  readonly product_id: number;
  readonly variation_id?: number;
  readonly quantity: number;
  readonly tax_class?: string;
  readonly subtotal: string;
  readonly subtotal_tax?: string;
  readonly total: string;
  readonly total_tax?: string;
  readonly sku?: string;
  readonly price: number;
  readonly meta_data: readonly WCMetaData[];
}

export interface OrderAuditEntry {
  readonly id: string;
  readonly action: string;
  readonly performedBy: string;
  readonly timestamp: string;
}

export interface WCOrder {
  readonly id: number;
  readonly number: string;
  readonly order_key?: string;
  readonly status: WCOrderStatus;
  readonly currency: string;
  readonly currency_symbol?: string;
  readonly date_created: string;
  readonly date_created_gmt?: string;
  readonly date_modified?: string;
  readonly date_modified_gmt?: string;
  readonly discount_total: string;
  readonly discount_tax?: string;
  readonly shipping_total: string;
  readonly shipping_tax?: string;
  readonly cart_tax?: string;
  readonly subtotal?: string;
  readonly total: string;
  readonly total_tax: string;
  readonly customer_id: number;
  readonly customer_note?: string;
  readonly billing: WCAddress;
  readonly shipping: WCAddress;
  readonly payment_method?: string;
  readonly payment_method_title?: string;
  readonly transaction_id?: string;
  readonly line_items: readonly WCLineItem[];
  readonly tax_lines: readonly WCTaxLine[];
  readonly shipping_lines: readonly WCShippingLine[];
  readonly fee_lines?: readonly WCFeeLine[];
  readonly coupon_lines?: readonly WCCouponLine[];
  readonly meta_data: readonly WCMetaData[];
  readonly store_id?: string;
  readonly store_name?: string;
  readonly last_modified_by?: string;
  readonly last_modified_at?: string;
  readonly audit_trail?: readonly OrderAuditEntry[];
}
