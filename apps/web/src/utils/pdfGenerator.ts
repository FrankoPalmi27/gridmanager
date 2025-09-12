import jsPDF from 'jspdf';
import { Sale } from '../store/salesStore';
import { formatCurrency } from '../lib/formatters';

export const generateInvoicePDF = (sale: Sale) => {
  const pdf = new jsPDF();
  
  // Company header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GRID MANAGER', 20, 30);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Sistema de Gestión Empresarial', 20, 38);
  
  // Invoice title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PROFORMA DE VENTA', 120, 30);
  
  // Sale number and date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Número: ${sale.number}`, 120, 40);
  pdf.text(`Fecha: ${new Date(sale.date).toLocaleDateString('es-AR')}`, 120, 48);
  
  // Line separator
  pdf.setLineWidth(0.5);
  pdf.line(20, 55, 190, 55);
  
  // Client information
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMACIÓN DEL CLIENTE', 20, 70);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Cliente: ${sale.client.name}`, 20, 80);
  pdf.text(`Email: ${sale.client.email}`, 20, 88);
  
  // Sale details
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DETALLES DE LA VENTA', 20, 110);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Cantidad de items: ${sale.items}`, 20, 120);
  pdf.text(`Canal de venta: ${getSalesChannelName(sale.salesChannel)}`, 20, 128);
  pdf.text(`Método de pago: ${getPaymentMethodName(sale.paymentMethod)}`, 20, 136);
  pdf.text(`Estado del pago: ${getPaymentStatusName(sale.paymentStatus)}`, 20, 144);
  
  // Payment tracking
  if (sale.cobrado !== undefined && sale.aCobrar !== undefined) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SEGUIMIENTO DE PAGOS', 20, 165);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Monto cobrado: ${formatCurrency(sale.cobrado)}`, 20, 175);
    pdf.text(`Monto a cobrar: ${formatCurrency(sale.aCobrar)}`, 20, 183);
  }
  
  // Total amount
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`TOTAL: ${formatCurrency(sale.amount)}`, 120, 200);
  
  // Status
  const statusColor = getStatusColor(sale.status);
  pdf.setTextColor(statusColor.r, statusColor.g, statusColor.b);
  pdf.text(`Estado: ${getStatusName(sale.status)}`, 120, 210);
  pdf.setTextColor(0, 0, 0); // Reset to black
  
  // Footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Este documento es una proforma generada automáticamente por Grid Manager', 20, 280);
  pdf.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 20, 288);
  
  // Download the PDF
  pdf.save(`Proforma_${sale.number}.pdf`);
};

// Helper functions
const getSalesChannelName = (channel?: string) => {
  switch (channel) {
    case 'store': return 'Tienda física';
    case 'online': return 'Online';
    case 'phone': return 'Teléfono';
    case 'whatsapp': return 'WhatsApp';
    case 'other': return 'Otro';
    default: return 'No especificado';
  }
};

const getPaymentMethodName = (method?: string) => {
  switch (method) {
    case 'cash': return 'Efectivo';
    case 'transfer': return 'Transferencia';
    case 'card': return 'Tarjeta';
    case 'check': return 'Cheque';
    case 'other': return 'Otro';
    default: return 'No especificado';
  }
};

const getPaymentStatusName = (status?: string) => {
  switch (status) {
    case 'paid': return 'Pagado';
    case 'pending': return 'Pendiente';
    case 'partial': return 'Parcial';
    default: return 'No especificado';
  }
};

const getStatusName = (status: string) => {
  switch (status) {
    case 'completed': return 'Completada';
    case 'pending': return 'Pendiente';
    case 'cancelled': return 'Cancelada';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return { r: 34, g: 197, b: 94 };
    case 'pending': return { r: 251, g: 191, b: 36 };
    case 'cancelled': return { r: 239, g: 68, b: 68 };
    default: return { r: 0, g: 0, b: 0 };
  }
};