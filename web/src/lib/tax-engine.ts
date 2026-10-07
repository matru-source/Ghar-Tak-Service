// ==============================================================================
// ElectriCare 18% GST Tax Calculation Engine
// Complies with Indian Goods and Services Tax Act rules for Electrical Works
// CGST 9.00% + SGST 9.00% = 18.00% Total Tax
// ==============================================================================

export interface TaxCalculationInput {
  baseLaborInr: number;
  materialsCostInr?: number;
  surgeMultiplier?: number; // e.g. 1.0 (standard), 1.25 (peak storm surge)
  discountInr?: number;
}

export interface TaxCalculationResult {
  baseLaborInr: number;
  materialsCostInr: number;
  subtotalBeforeTax: number;
  discountInr: number;
  taxableValue: number;
  cgstRatePct: number;
  cgstAmountInr: number;
  sgstRatePct: number;
  sgstAmountInr: number;
  totalGstAmountInr: number;
  totalPayableInr: number;
  formattedTotal: string;
}

export function calculateIndianGst18(input: TaxCalculationInput): TaxCalculationResult {
  const multiplier = input.surgeMultiplier && input.surgeMultiplier > 0 ? input.surgeMultiplier : 1.0;
  const rawLabor = input.baseLaborInr * multiplier;
  const materials = input.materialsCostInr && input.materialsCostInr > 0 ? input.materialsCostInr : 0;
  const discount = input.discountInr && input.discountInr > 0 ? input.discountInr : 0;

  const subtotal = Math.round((rawLabor + materials) * 100) / 100;
  const taxable = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  // 18% GST split equally: 9% Central GST + 9% State GST
  const CGST_RATE = 9.0;
  const SGST_RATE = 9.0;

  const cgstAmount = Math.round(((taxable * CGST_RATE) / 100) * 100) / 100;
  const sgstAmount = Math.round(((taxable * SGST_RATE) / 100) * 100) / 100;
  const totalGst = Math.round((cgstAmount + sgstAmount) * 100) / 100;

  const totalPayable = Math.round((taxable + totalGst) * 100) / 100;

  return {
    baseLaborInr: Math.round(rawLabor * 100) / 100,
    materialsCostInr: Math.round(materials * 100) / 100,
    subtotalBeforeTax: subtotal,
    discountInr: discount,
    taxableValue: taxable,
    cgstRatePct: CGST_RATE,
    cgstAmountInr: cgstAmount,
    sgstRatePct: SGST_RATE,
    sgstAmountInr: sgstAmount,
    totalGstAmountInr: totalGst,
    totalPayableInr: totalPayable,
    formattedTotal: `₹${totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  };
}
