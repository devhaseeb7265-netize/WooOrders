"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Store,
  Image as ImageIcon,
  Building,
  MapPin,
  Phone,
  FileText,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { FlipButton } from "@/components/motion/FlipButton";
import { updateStoreInvoiceSettingsAction } from "@/app/actions/store-actions";

export function StoreInvoiceSettings() {
  const { connectedStores, activeStoreId, refreshActiveStore } = useStore();

  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    activeStoreId || connectedStores[0]?.id || ""
  );

  const selectedStore =
    connectedStores.find((s) => s.id === selectedStoreId) || connectedStores[0];

  const [logoUrl, setLogoUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [billFromAddress, setBillFromAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [invoiceTerms, setInvoiceTerms] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logoImgError, setLogoImgError] = useState(false);

  useEffect(() => {
    if (selectedStore) {
      setLogoUrl(selectedStore.logo_url || "");
      setCompanyName(selectedStore.company_name || selectedStore.name || "");
      setBillFromAddress(selectedStore.bill_from_address || "");
      setCompanyPhone(selectedStore.company_phone || "");
      setInvoiceTerms(
        selectedStore.invoice_terms ||
          "Thank you for your business. For any return or support inquiries, please contact our support desk."
      );
      setLogoImgError(false);
    }
  }, [selectedStoreId, selectedStore]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) {
      setErrorMessage("Please select a store to configure.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await updateStoreInvoiceSettingsAction(selectedStoreId, {
        logo_url: logoUrl,
        company_name: companyName,
        bill_from_address: billFromAddress,
        company_phone: companyPhone,
        invoice_terms: invoiceTerms,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to update invoice settings.");
        return;
      }

      setSuccessMessage("Invoice & Branding settings saved successfully!");
      await refreshActiveStore();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save error";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (connectedStores.length === 0) {
    return (
      <div className="bg-white rounded-[28px] p-8 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center py-20 text-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
          <Receipt className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-zinc-900">No Stores Connected</h3>
        <p className="text-xs text-zinc-500 max-w-sm">
          Connect your WooCommerce store first to configure customized invoice receipts and store-level branding.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] p-7 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
        <div>
          <h2 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#00875A]" />
            <span>Store Invoice & Branding Profile</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure store logo, legal trading name, origin address, and terms displayed on customer receipts.
          </p>
        </div>

        {/* Store Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="store-select" className="text-xs font-semibold text-zinc-500 shrink-0">
            Store:
          </label>
          <div className="relative">
            <select
              id="store-select"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-3.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-full text-xs font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-[#00875A]/20 cursor-pointer"
            >
              {connectedStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.url.replace(/^https?:\/\//, "")})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl text-xs text-[#00875A] font-semibold animate-in fade-in">
          <Check className="h-4 w-4 shrink-0 text-[#00875A]" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200/90 rounded-2xl text-xs text-rose-800 font-semibold animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-zinc-400" />
              Company / Store Trading Name
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Lumina Home Decor"
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-2 focus:ring-[#00875A]/10 transition-all"
            />
            <span className="text-[11px] text-zinc-400">
              Printed on invoice header and Bill From address block.
            </span>
          </div>

          {/* Support Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-zinc-400" />
              Support / Business Phone
            </label>
            <input
              type="text"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="e.g. +1 (555) 234-5678"
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-2 focus:ring-[#00875A]/10 transition-all"
            />
            <span className="text-[11px] text-zinc-400">
              Customer support phone rendered on invoices.
            </span>
          </div>

          {/* Store Logo URL + Preview */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
              Store Logo Image URL
            </label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {logoUrl && !logoImgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Store Logo"
                    onError={() => setLogoImgError(true)}
                    className="h-full w-full object-contain p-1.5"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-300">
                    <Store className="h-6 w-6" />
                    <span className="text-[9px] font-mono mt-0.5">Preview</span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => {
                    setLogoUrl(e.target.value);
                    setLogoImgError(false);
                  }}
                  placeholder="https://yourstore.com/wp-content/uploads/logo.png"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:bg-white focus:border-[#00875A] focus:ring-2 focus:ring-[#00875A]/10 transition-all"
                />
                <span className="text-[11px] text-zinc-400">
                  Direct image URL (PNG, SVG, or JPG). Displayed in the top left of receipts.
                </span>
              </div>
            </div>
          </div>

          {/* Bill From Origin Address */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
              Bill From Origin Address
            </label>
            <textarea
              rows={2}
              value={billFromAddress}
              onChange={(e) => setBillFromAddress(e.target.value)}
              placeholder="e.g. 148 West 24th St, 6th Floor, New York, NY 10011"
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-2 focus:ring-[#00875A]/10 transition-all resize-none"
            />
            <span className="text-[11px] text-zinc-400">
              Warehouse or store headquarters address printed in Bill From section.
            </span>
          </div>

          {/* Default Terms & Conditions / Note */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-zinc-400" />
              Default Terms & Conditions / Receipt Note
            </label>
            <textarea
              rows={3}
              value={invoiceTerms}
              onChange={(e) => setInvoiceTerms(e.target.value)}
              placeholder="Enter invoice footer notes, return policy, or thank you note..."
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-2 focus:ring-[#00875A]/10 transition-all resize-none"
            />
            <span className="text-[11px] text-zinc-400">
              Rendered on the bottom-left of customer printed invoices.
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-3 border-t border-zinc-100">
          <FlipButton
            type="submit"
            variant="primary"
            size="md"
            label={isSaving ? "Saving Settings..." : "Save Invoice Settings"}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full shadow-xs"
          />
        </div>
      </form>
    </div>
  );
}
