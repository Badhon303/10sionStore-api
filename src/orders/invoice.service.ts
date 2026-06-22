import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Generate an invoice PDF for an order and return it as a Buffer. */
  async generate(storeId: string, orderId: string): Promise<{ buffer: Buffer; filename: string }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { items: true, store: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));

    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Header
    doc.fontSize(20).text(order.store.name, { align: 'left' });
    doc.fontSize(10).fillColor('#666').text(order.store.description || '', { align: 'left' });
    doc.moveDown();
    doc.fillColor('#000').fontSize(16).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text(`Order: ${order.orderNumber}`, { align: 'right' });
    doc.text(`Date: ${order.createdAt.toISOString().slice(0, 10)}`, { align: 'right' });
    if (order.trackingId) doc.text(`Tracking: ${order.trackingId}`, { align: 'right' });
    doc.moveDown();

    // Shipping
    doc.fontSize(12).fillColor('#000').text('Bill To:');
    doc.fontSize(10).fillColor('#333');
    doc.text(order.shippingName);
    doc.text(order.shippingPhone);
    doc.text(`${order.shippingAddress}, ${order.shippingThana}, ${order.shippingDistrict}`);
    doc.moveDown();

    // Items table
    const startY = doc.y + 10;
    doc.fontSize(10).fillColor('#000');
    doc.text('Item', 50, startY);
    doc.text('Qty', 320, startY);
    doc.text('Price', 380, startY);
    doc.text('Total', 470, startY);
    doc.moveTo(50, startY + 15).lineTo(545, startY + 15).stroke();

    let y = startY + 25;
    for (const item of order.items) {
      const label = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
      doc.text(label, 50, y, { width: 260 });
      doc.text(String(item.quantity), 320, y);
      doc.text(Number(item.price).toFixed(2), 380, y);
      doc.text(Number(item.total).toFixed(2), 470, y);
      y += 22;
    }

    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 10;
    const currency = order.store.currency;
    const right = (label: string, value: string) => {
      doc.text(label, 380, y);
      doc.text(value, 470, y);
      y += 18;
    };
    right('Subtotal', `${Number(order.subtotal).toFixed(2)} ${currency}`);
    right('Discount', `-${Number(order.discount).toFixed(2)}`);
    right('Shipping', `${Number(order.shippingCharge).toFixed(2)}`);
    doc.fontSize(12);
    right('Total', `${Number(order.total).toFixed(2)} ${currency}`);

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#888').text('Thank you for your order!', 50, doc.y, { align: 'center' });

    doc.end();
    const buffer = await done;

    await this.prisma.order.update({ where: { id: orderId }, data: { invoicePrinted: true } });
    return { buffer, filename: `${order.orderNumber}.pdf` };
  }
}
