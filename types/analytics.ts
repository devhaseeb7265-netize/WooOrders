export type DateRangePreset =
  | "today"
  | "last_7_days"
  | "this_month"
  | "last_30_days"
  | "year_to_date";

export interface RevenueDataPoint {
  readonly date: string;
  readonly label: string;
  readonly revenue: number;
  readonly ordersCount: number;
  readonly aov: number;
}

export interface StatusBreakdown {
  readonly status: string;
  readonly count: number;
  readonly percentage: number;
  readonly color: string;
}

export interface PaymentMethodStat {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly orderCount: number;
  readonly percentage: number;
}

export interface StoreAnalyticsSummary {
  readonly storeId: string;
  readonly storeName: string;
  readonly currency: string;
  readonly totalNetSales: number;
  readonly salesGrowth: number;
  readonly totalOrders: number;
  readonly ordersGrowth: number;
  readonly averageOrderValue: number;
  readonly aovGrowth: number;
  readonly refundRate: number;
  readonly refundRateDelta: number;
  readonly refundAmount: number;
  readonly activeWebhooksCount: number;
  readonly revenueTrend: readonly RevenueDataPoint[];
  readonly paymentMethods: readonly PaymentMethodStat[];
  readonly statusBreakdown: readonly StatusBreakdown[];
}

export type WebhookStatus = "delivered" | "retrying" | "queued" | "failed";

export interface WebhookEventLog {
  readonly id: string;
  readonly eventId: string;
  readonly topic: "order.created" | "order.updated" | "order.deleted" | "batch.sync";
  readonly storeId: string;
  readonly storeName: string;
  readonly responseCode: number;
  readonly status: WebhookStatus;
  readonly timestamp: string;
  readonly durationMs: number;
  readonly resourceId: string;
  readonly payload: Record<string, unknown>;
}
