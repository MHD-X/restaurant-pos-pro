// Printing is now handled entirely via browser window.print() with CSS @media print.
// This module exists only for backward import compatibility.

export interface PrintResult {
  success: boolean;
  error?: string;
}

export function browserPrint(): PrintResult {
  try {
    window.print();
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `فشل الطباعة: ${msg}` };
  }
}
