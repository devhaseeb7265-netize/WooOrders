"use client";

import React from "react";
import { CreditCard, Wallet, CircleDollarSign, Smartphone } from "lucide-react";
import { PaymentMethodStat } from "@/types/analytics";

interface PaymentMethodDistributionProps {
  methods: readonly PaymentMethodStat[];
  currency?: string;
}

export function PaymentMethodDistribution({
  methods,
  currency = "USD",
}: PaymentMethodDistributionProps) {
  const getIcon = (id: string) => {
    switch (id) {
      case "stripe":
        return <CreditCard className="h-4 w-4 text-[#00875A]" />;
      case "apple_pay":
        return <Smartphone className="h-4 w-4 text-blue-600" />;
      case "paypal":
        return <Wallet className="h-4 w-4 text-indigo-600" />;
      default:
        return <CircleDollarSign className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)] w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Payment Gateways</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Order volume share by checkout method</p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 font-medium">
          {methods.reduce((a, b) => a + b.orderCount, 0)} orders total
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {methods.map((method) => (
          <div key={method.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-7 w-7 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  {getIcon(method.id)}
                </div>
                <span className="font-semibold text-zinc-800">{method.name}</span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-zinc-900">
                  ${method.amount.toLocaleString()} {currency}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold">
                  {method.percentage}%
                </span>
              </div>
            </div>

            {/* Visual Pill Progress Bar */}
            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#00875A] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${method.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
