import * as XLSX from "xlsx";
import { WCOrder } from "@/types/woocommerce";

export interface CourierExportRow {
  Order_Ref: string;
  Consignee_Name: string;
  Consignee_Phone: string;
  Consignee_Email: string;
  Destination_City: string;
  Delivery_Address: string;
  COD_Amount: string;
  Pieces_Count: number;
  Product_Description: string;
  Special_Instructions: string;
}

/**
 * Maps WooCommerce orders to the standardized Courier & Logistics dispatch format.
 * Internal status and developer keys are purged for direct ingestion by courier portals (TCS, Leopards, Trax, DHL, etc.).
 */
export function formatOrdersForCourier(orders: readonly WCOrder[]): CourierExportRow[] {
  return orders.map((order) => {
    // 1. Order_Ref
    const orderRef = `#${order.number || order.id}`;

    // 2. Consignee_Name
    const firstName = order.shipping?.first_name || order.billing?.first_name || "";
    const lastName = order.shipping?.last_name || order.billing?.last_name || "";
    const consigneeName = `${firstName} ${lastName}`.trim() || "Valued Customer";

    // 3. Consignee_Phone
    const phone = order.billing?.phone || order.shipping?.phone || "";

    // 4. Consignee_Email
    const email = order.billing?.email || order.shipping?.email || "";

    // 5. Destination_City
    const city = order.shipping?.city || order.billing?.city || "";

    // 6. Delivery_Address
    const addr1 = order.shipping?.address_1 || order.billing?.address_1 || "";
    const addr2 = order.shipping?.address_2 || order.billing?.address_2 || "";
    const postcode = order.shipping?.postcode || order.billing?.postcode || "";
    const addressParts = [addr1, addr2, postcode].filter(Boolean);
    const deliveryAddress = addressParts.join(", ");

    // 7. COD_Amount
    const methodSlug = (order.payment_method || "").toLowerCase();
    const methodTitle = (order.payment_method_title || "").toLowerCase();
    const isCOD =
      methodSlug === "cod" ||
      methodSlug.includes("cash") ||
      methodTitle.includes("cash on delivery") ||
      methodTitle.includes("cod");

    const cleanTotal = Number(order.total);
    const codAmount = isCOD ? (!isNaN(cleanTotal) ? cleanTotal.toFixed(2) : "0.00") : "0.00";

    // 8. Pieces_Count
    const piecesCount = (order.line_items || []).reduce(
      (acc, item) => acc + (Number(item.quantity) || 1),
      0
    );

    // 9. Product_Description
    const productDescription = (order.line_items || [])
      .map((item) => `${item.quantity || 1}x ${item.name.replace(/,/g, "")}`)
      .join(", ");

    // 10. Special_Instructions
    const specialInstructions = order.customer_note || "";

    return {
      Order_Ref: orderRef,
      Consignee_Name: consigneeName,
      Consignee_Phone: phone,
      Consignee_Email: email,
      Destination_City: city,
      Delivery_Address: deliveryAddress,
      COD_Amount: codAmount,
      Pieces_Count: piecesCount,
      Product_Description: productDescription,
      Special_Instructions: specialInstructions,
    };
  });
}

/**
 * Triggers client-side download of a Courier Manifest in Excel (.xlsx) format.
 */
export function exportOrdersToExcel(
  orders: readonly WCOrder[],
  filenamePrefix = "courier_manifest"
): void {
  if (!orders || orders.length === 0) return;

  const rows = formatOrdersForCourier(orders);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Optimized column widths for logistics readability
  worksheet["!cols"] = [
    { wch: 14 }, // Order_Ref
    { wch: 24 }, // Consignee_Name
    { wch: 18 }, // Consignee_Phone
    { wch: 28 }, // Consignee_Email
    { wch: 18 }, // Destination_City
    { wch: 42 }, // Delivery_Address
    { wch: 14 }, // COD_Amount
    { wch: 14 }, // Pieces_Count
    { wch: 38 }, // Product_Description
    { wch: 30 }, // Special_Instructions
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Courier Manifest");

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filenamePrefix}_${timestamp}.xlsx`);
}

/**
 * Triggers client-side download of a Courier Manifest in CSV (.csv) format.
 */
export function exportOrdersToCSV(
  orders: readonly WCOrder[],
  filenamePrefix = "courier_manifest"
): void {
  if (!orders || orders.length === 0) return;

  const rows = formatOrdersForCourier(orders);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filenamePrefix}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
