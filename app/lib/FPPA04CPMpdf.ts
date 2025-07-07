// --- lib/FPPA04CPMpdf.ts ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fontBase64 from "@/app/fonts/THSarabunNew.base64";
import fontBoldBase64 from "@/app/fonts/THSarabunNew Bold.base64";

export interface Fppa04ItemCPM { category: string; description: string; total: number; exception: number; }
export interface Fppa04AdjustmentCPM { type: string; description: string; amount: number; }
export interface Fppa04CPMData {
  approverName: string;
  claimRefNumber: string;
  policyNumber: string;
  eventType: string;
  eventDescription: string;
  productionYear: number;
  accidentDate: string;
  reportedDate: string;
  receivedDocDate: string;
  company: string;
  factory: string;
  surveyorRefNumber: string;
  items: Fppa04ItemCPM[];
  adjustments: Fppa04AdjustmentCPM[];
}

export function createFPPA04CPMPDF(data: Fppa04CPMData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // embed fonts
  doc.addFileToVFS("THSarabunNew.ttf", fontBase64);
  doc.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
  doc.addFileToVFS("THSarabunNew-Bold.ttf", fontBoldBase64);
  doc.addFont("THSarabunNew-Bold.ttf", "THSarabunNew", "bold");

  // Title
  doc.setFont("THSarabunNew", "bold").setFontSize(18);
  doc.text("รายงานสรุปรายการรับเงินค่าสินไหมทดแทน", 105, 15, { align: "center" });

  // Thai date formatter (Buddhist Era)
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("th-TH-u-ca-buddhist", { day: "2-digit", month: "short", year: "numeric" });

  // Header row above main table
  autoTable(doc, {
    startY: 20,
    theme: 'grid',
    styles: { font: 'THSarabunNew', fontSize: 12, cellPadding: 2, valign: 'middle' },
    margin: { left: 10, right: 10 },
    columnStyles: { 0: { cellWidth: 95 }, 1: { cellWidth: 95 } },
    tableLineWidth: 0.1,
    tableLineColor: [0,0,0]
  });

  // Compute Y-pos after header row
  const afterHeaderY = (doc as any).lastAutoTable.finalY + 4;

  // Metadata under header
  doc.setFont("THSarabunNew", "normal").setFontSize(11);doc.setTextColor(0, 0, 0);
  doc.text(`ประเภทกรมธรรม์: ${data.eventType}`, 10, afterHeaderY);
  doc.text(`หมายเลขรับ Claim: ${data.claimRefNumber}`, 100, afterHeaderY);

  // Event description and production year
  const wrappedDesc = doc.splitTextToSize(data.eventDescription, 80);
  doc.text("เหตุการณ์:", 10, afterHeaderY + 6);
  doc.text(wrappedDesc, 30, afterHeaderY + 6);
  doc.text(`ปีที่ผลิต: ${data.productionYear + 543}`, 140, afterHeaderY + 6);

  // Dates
  doc.text(`วันที่เกิดเหตุ: ${fmtDate(data.accidentDate)}`, 10, afterHeaderY + 12);
  doc.text(`วันที่รับแจ้ง: ${fmtDate(data.reportedDate)}`, 75, afterHeaderY + 12);
  doc.text(`วันที่ได้รับเอกสาร: ${fmtDate(data.receivedDocDate)}`, 140, afterHeaderY + 12);

  // Company / Factory / Approver
  doc.text(`บริษัท: ${data.company}`, 10, afterHeaderY + 18);
  doc.text(`โรงงาน: ${data.factory}`, 75, afterHeaderY + 18);
  doc.text(`ผู้ช่วยกรรมการผู้จัดการ: ${data.approverName}`, 140, afterHeaderY + 18);

  // Main items table
  const summaryRow = [
  '1 รายการแจ้ง Claim ประกัน', // your label in col 0
  '',                          // leave description blank
  data.items
    .reduce((sum, it) => sum + it.total, 0)
    .toFixed(2),                // total of all “รวม”
  data.items
    .reduce((sum, it) => sum + it.exception, 0)
    .toFixed(2),                // total of all “ข้อยกเว้น”
  data.items
    .reduce((sum, it) => sum + (it.total - it.exception), 0)
    .toFixed(2),                // total of all “ภายใต้ความคุ้มครอง”
];
const itemsStartY = afterHeaderY + 24;
autoTable(doc, {
  startY: itemsStartY,
  head: [
    [
      { content: `เลขที่กรมธรรม์: ${data.policyNumber}`, colSpan: 2, styles: { halign: 'center', fillColor: [235,235,235] } },
      { content: `เลขที่ Claim Surveyor: ${data.surveyorRefNumber}`, colSpan: 3, styles: { halign: 'center', fillColor: [235,235,235] } }
    ],
    [
      { content: 'รายการ', rowSpan: 2 },
      { content: 'รายละเอียด (เอกสารแนบ 1)', rowSpan: 2 },
      { content: 'จำนวนความเสียหาย (บาท)', colSpan: 3, styles: { halign: 'center' } }
    ],
    ['รวม', 'ข้อยกเว้น', 'ภายใต้ความคุ้มครอง']
  ],
  body: [
    // insert the aggregated summary row first
    summaryRow,
    // then your individual items
    ...data.items.map((it, i) => [
      (i + 1).toString(),
      it.description,
      it.total.toFixed(2),
      it.exception.toFixed(2),
      (it.total - it.exception).toFixed(2),
    ]),
  ],
  styles: {
    textColor: [0,0,0],
    font: 'THSarabunNew',
    fontSize: 10,
    cellPadding: 2,
    lineWidth: 0.1,
    lineColor: [200,200,200],
  },
  headStyles: {
    fillColor: [230,230,230],
    fontStyle: 'bold',
    halign: 'center',
  },
  alternateRowStyles: { fillColor: [250,250,250] },
  columnStyles: {
    0: { halign: 'left' },
    2: { halign: 'right' },
    3: { halign: 'right' },
    4: { halign: 'right' },
  },
  margin: { left: 10, right: 10 },
});

  // Adjustments table below
  const adjStartY = (doc as any).lastAutoTable.finalY + 8;
  autoTable(doc, {
    startY: adjStartY,
    head: [['ประเภทปรับปรุง', 'รายละเอียด', 'จำนวน (บาท)']],
    body: data.adjustments.map(adj => [adj.type, adj.description, adj.amount.toFixed(2)]),
    styles: { textColor: [0,0,0],font: 'THSarabunNew', fontSize: 10, cellPadding: 2, lineWidth: 0.1, lineColor: [200,200,200] },
    headStyles: { fillColor: [230,230,230], fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [250,250,250] },
    columnStyles: { 2: { halign: 'right' } },
    margin: { left: 10, right: 10 }
  });

  return doc;
}
