import { format } from 'date-fns';

export interface InvoiceData {
  subscriptionId: string;
  invoiceNumber: string;
  date: string;
  customer: { name: string; email: string };
  plan: { name: string; amount: number; currency: string };
  period: { start: string | null; end: string | null };
  total: number;
}

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor: [number, number, number] = [16, 185, 129];
  const secondaryColor: [number, number, number] = [59, 130, 246];
  const darkColor: [number, number, number] = [15, 23, 42];
  const lightColor: [number, number, number] = [241, 245, 249];
  const textColor: [number, number, number] = [51, 65, 85];

  let yPos = 0;

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');
  doc.setFillColor(...secondaryColor);
  doc.rect(0, 48, pageWidth, 2, 'F');

  doc.setFillColor(255, 255, 255);
  doc.circle(25, 25, 12, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('yH', 25, 28, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Balencia', 50, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Health, Your Future', 50, 28);

  doc.setFontSize(8);
  doc.text('support@balencia.app', pageWidth - 20, 20, { align: 'right' });
  doc.text('www.balencia.app', pageWidth - 20, 26, { align: 'right' });
  doc.text('+1 (555) 123-4567', pageWidth - 20, 32, { align: 'right' });

  yPos = 60;

  // Invoice title
  doc.setTextColor(...darkColor);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // Invoice number and date
  doc.setFillColor(...lightColor);
  safeRoundedRect(doc, 20, yPos - 8, pageWidth - 40, 20, 3);

  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Invoice Number:', 25, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(invoiceData.invoiceNumber, 25, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.text('Date:', pageWidth - 25, yPos, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(format(new Date(invoiceData.date), 'PP'), pageWidth - 25, yPos + 6, { align: 'right' });
  yPos += 25;

  // Bill To
  doc.setFillColor(...primaryColor);
  safeRoundedRect(doc, 20, yPos - 2, 85, 2.5, 1.5);

  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, yPos + 4);
  yPos += 10;

  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.customer.name, 20, yPos);
  yPos += 6;
  doc.setFontSize(10);
  doc.text(invoiceData.customer.email, 20, yPos);
  yPos += 20;

  // Plan details table header
  doc.setFillColor(...primaryColor);
  safeRoundedRect(doc, 20, yPos - 5, pageWidth - 40, 12, 2);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 25, yPos + 2);
  doc.text('Amount', pageWidth - 25, yPos + 2, { align: 'right' });
  yPos += 12;

  // Plan details content
  doc.setFillColor(255, 255, 255);
  safeRoundedRect(doc, 20, yPos - 8, pageWidth - 40, 30, 2);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  safeRoundedRect(doc, 20, yPos - 8, pageWidth - 40, 30, 2, 'S');

  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Subscription Plan:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.plan.name, 25, yPos + 6);

  if (invoiceData.period.start && invoiceData.period.end) {
    doc.text(
      `Period: ${format(new Date(invoiceData.period.start), 'PP')} - ${format(new Date(invoiceData.period.end), 'PP')}`,
      25,
      yPos + 12,
    );
  }

  doc.setFont('helvetica', 'bold');
  doc.text(`${invoiceData.plan.currency} ${invoiceData.total.toFixed(2)}`, pageWidth - 25, yPos + 6, { align: 'right' });
  yPos += 35;

  // Total
  doc.setFillColor(...secondaryColor);
  safeRoundedRect(doc, pageWidth - 90, yPos - 5, 70, 20, 3);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Amount', pageWidth - 85, yPos + 3);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${invoiceData.plan.currency} ${invoiceData.total.toFixed(2)}`, pageWidth - 85, yPos + 12);
  yPos += 30;

  // Notes
  if (yPos < pageHeight - 60) {
    doc.setFillColor(...lightColor);
    safeRoundedRect(doc, 20, yPos - 5, pageWidth - 40, 25, 2);

    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Terms:', 25, yPos + 3);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment is due upon receipt. Thank you for your business!', 25, yPos + 9, { maxWidth: pageWidth - 50 });
  }

  // Footer
  const footerY = pageHeight - 40;
  doc.setFillColor(...darkColor);
  doc.rect(0, footerY, pageWidth, 40, 'F');
  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Balencia Inc.', 20, footerY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('123 Health Street, Suite 100', 20, footerY + 16);
  doc.text('San Francisco, CA 94102, USA', 20, footerY + 22);

  doc.text('Email: support@balencia.app', pageWidth / 2, footerY + 10);
  doc.text('Phone: +1 (555) 123-4567', pageWidth / 2, footerY + 16);
  doc.text('Website: www.balencia.app', pageWidth / 2, footerY + 22);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated invoice. No signature required.', pageWidth / 2, footerY + 30, { align: 'center' });
  doc.text('© 2026 Balencia Inc. All rights reserved.', pageWidth / 2, footerY + 35, { align: 'center' });

  // Corner decorations
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.line(0, 0, 15, 0);
  doc.line(0, 0, 0, 15);
  doc.line(pageWidth - 15, 0, pageWidth, 0);
  doc.line(pageWidth, 0, pageWidth, 15);

  doc.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeRoundedRect(doc: any, x: number, y: number, w: number, h: number, r: number, style: string = 'F') {
  try {
    doc.roundedRect(x, y, w, h, r, r, style);
  } catch {
    doc.rect(x, y, w, h, style);
  }
}
