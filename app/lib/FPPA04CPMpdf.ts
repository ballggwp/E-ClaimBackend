// --- lib/FPPA04CPMpdf.ts ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fontBase64 from "@/app/fonts/THSarabunNew.base64";
import fontBoldBase64 from "@/app/fonts/THSarabunNew Bold.base64";

export interface Fppa04ItemCPM { category: string; description: string; total: number; exception: number; }
export interface Fppa04AdjustmentCPM { type: string; description: string; amount: number; }
export interface Fppa04CPMData {
  insurancePayout:string;
  netAmount:string;
  signerName:string;
  signerPosition:string;
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
  datePendingManager: string;   // ISO when status went to PENDING_MANAGER_REVIEW
  dateCompleted:      string; 
}

const fmtDate = (iso: string) =>
  new Date(iso)
    .toLocaleDateString("th-TH-u-ca-buddhist", {
      day:   "2-digit",
      month: "2-digit",
      year:  "numeric",
    })

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
  const afterHeaderY = (doc as any).lastAutoTable.finalY + 8;

  // Metadata under header
  doc.setFont("THSarabunNew", "normal").setFontSize(11);doc.setTextColor(0, 0, 0);
  doc.text(`ประเภทกรมธรรม์: ${data.eventType}`, 10, afterHeaderY);
  doc.text(`หมายเลขรับ Claim: ${data.claimRefNumber}`, 130, afterHeaderY);

  // Event description and production year
  const wrappedDesc = doc.splitTextToSize(data.eventDescription, 80);
  doc.text("เหตุการณ์:", 10, afterHeaderY + 6);
  doc.text(wrappedDesc, 30, afterHeaderY + 6);
  doc.text(`ปีที่ผลิต: ${data.productionYear + 543}`, 130, afterHeaderY + 6);

  // Dates
  doc.text(`วันที่เกิดเหตุ: ${fmtDate(data.accidentDate)}`, 10, afterHeaderY + 12);
  doc.text(`วันที่รับแจ้ง: ${fmtDate(data.reportedDate)}`, 80, afterHeaderY + 12);
  doc.text(`วันที่ได้รับเอกสาร: ${fmtDate(data.receivedDocDate)}`, 130, afterHeaderY + 12);

  // Company / Factory / Approver
  doc.text(`บริษัท: ${data.company}`, 10, afterHeaderY + 18);
  doc.text(`โรงงาน: ${data.factory}`, 80, afterHeaderY + 18);
  doc.text(`ผู้ช่วยกรรมการผู้จัดการ: ${data.approverName}`, 130, afterHeaderY + 18);

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
      ((i+1)/10 + 1).toString(),
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
    cellPadding: 1,
    lineWidth: 0.1,
    lineColor: [0,0,0],
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

const insurancePayoutStr = Number(data.insurancePayout || 0).toFixed(2);
const netAmountStr       = Number(data.netAmount       || 0).toFixed(2);

  // Adjustments table below
  const adjStartY = (doc as any).lastAutoTable.finalY;
  autoTable(doc, {
    startY: adjStartY,
    head: [
    // แถวแรก: Section 5 + ยอดประกัน
    [
      { 
        content: 'การพิจารณาจ่ายสินไหมจาก บ.ประกันภัย',
        colSpan: 2,
        styles: { halign: 'left' }
      },
      { 
        content: insurancePayoutStr,
        styles: { halign: 'right' }
      }
    ],
    // แถวที่สอง: ผลการเจรจาต่อรอง
    [
      {
        content: 'ผลการเจรจาต่อรองเพิ่มเติม',
        colSpan: 3,
        styles: { halign: 'center', fillColor: [230,230,230] }
      }
    ]
  ],
    body: data.adjustments.map(adj => [adj.type, adj.description, adj.amount.toFixed(2)]),
    styles: { textColor: [0,0,0],font: 'THSarabunNew', fontSize: 10, cellPadding: 1, lineWidth: 0.1, lineColor: [0,0,0] },
    headStyles: { fillColor: [230,230,230], fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [250,250,250] },
    columnStyles: { 2: { halign: 'right' } },
    margin: { left: 10, right: 10 }
  });

  const sumStartY = (doc as any).lastAutoTable.finalY;
  autoTable(doc, {
    startY: sumStartY,
    head: [
    // แถวแรก: Section 5 + ยอดประกัน
    [
      { 
        content: 'เงินค่ารับค่าสินไหมทดแทน (สุทธิ)',
        styles: { halign: 'left' }
      },
      
      { 
        content: netAmountStr,
        styles: { halign: 'right' }
      }

    ],
    // แถวที่สอง: ผลการเจรจาต่อรอง
  ],
    styles: { textColor: [0,0,0],font: 'THSarabunNew', fontSize: 10, cellPadding: 1, lineWidth: 0.1, lineColor: [0,0,0] },
    headStyles: { fillColor: [230,230,230], fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [250,250,250] },
    columnStyles: { 2: { halign: 'right' } },
    margin: { left: 10, right: 10 }
  });
  

  const lastY = (doc as any).lastAutoTable.finalY;
  const sigY  = lastY + 8;      // จุดเริ่มต้นของแถวหัวลายเซ็นต์
  const cellHeight = 35;         // สูงของกรอบแต่ละช่อง
  const cellWidth  =  (210 - 20) / 3; // width รวมเท่ากับ margin 10 + 10 ออก แล้วหาร 3
  const startX = 10;             // margin ซ้าย

  // 1) วาดกรอบทั้งสามช่องก่อน
  doc.setDrawColor(0,0,0);
  doc.setLineWidth(0.01);
  for (let i = 0; i < 3; i++) {
    const x = startX + cellWidth * i;
    doc.rect(x, sigY - 4, cellWidth, cellHeight);
  }

  // 2) วนวาด หัว-ชื่อ-วันที่ ภายในแต่ละกรอบ
  const centers = [0,1,2].map(i => ({
  x: startX + cellWidth * i + cellWidth / 2,
  yTop: sigY + 4,
  yMiddle1: sigY + cellHeight / 2-2,                              // หัวข้อจะอยู่ห่างจากบนกรอบ 6 มม.
  yMiddle: sigY + cellHeight / 1.5-1,            // ชื่อกึ่งกลาง
  yBottom: sigY + cellHeight - 6             // วันที่จะอยู่ห่างจากล่างกรอบ 6 มม.
}));
const signerPositionLines = doc
  .splitTextToSize(data.signerPosition, cellWidth - 8)
const titles = [
  'ฝ่ายประกันภัยกลุ่ม',
  'ผู้ตรวจสอบ',
  signerPositionLines
];
const names = [
  'สุวิมล ว่องกุศลกิจ',
  data.approverName.replace(/^(นาย|นางสาว|นาง)\s*/, ''),
  data.signerName.replace(/^(นาย|นางสาว|นาง)\s*/, '')
];
const labels = [
  fmtDate(data.datePendingManager),
  fmtDate(data.dateCompleted),         // for “ผู้ตรวจสอบ”
  fmtDate(data.dateCompleted),         // for “ผู้เซ็น” (same as completed)
];

for (let i = 0; i < 3; i++) {
  const leftX  = startX + i * cellWidth;
  const rightX = leftX + cellWidth;
  const c      = centers[i];

  // 1) หัวคอลัมน์ (title)
  doc.setFont('THSarabunNew','bold').setFontSize(12);
  doc.text(titles[i], c.x, c.yTop-2, { align: 'center' });

  // 2) เส้นแบ่ง (divider) 
  const dividerY = c.yTop + 4;      // ปรับระยะตามดีไซน์
  doc.setLineWidth(0.2);
  doc.setDrawColor(0);
  doc.line(leftX + 2, dividerY, rightX - 2, dividerY);
  doc.text(`${names[i]}`, c.x, c.yMiddle1, { align: 'center' });
  // 3) ชื่อ (signature placeholder หรือ image)
  doc.setFont('THSarabunNew','normal').setFontSize(11);
  doc.text(`(${names[i]})`, c.x, c.yMiddle, { align: 'center' });

  // 4) วันที่
  doc.setFontSize(10);
  doc.text(labels[i], c.x, c.yBottom, { align: 'center' });
}
// ===== 1) หัวตาราง สำหรับฝ่ายประกันภัยกลุ่ม =====
const tableY    = (doc as any).lastAutoTable.finalY + 50;
const marginL   = 10;
const marginR   = 70;       // เว้นที่วาดกล่องเซ็นขวา
const pageW     = 210;
const tableW    = pageW - marginL - marginR;
const colWidths = [0.4, 0.2, 0.2, 0.2].map(f => f * tableW);

// 1) พาดหัว
doc.setTextColor(0, 82, 155);
doc.setFont("THSarabunNew","bold").setFontSize(12);
doc.text("สำหรับฝ่ายประกันภัยกลุ่ม", marginL, tableY);
doc.setTextColor(0,0,0);

// 2) วาดตารางเปล่า
autoTable(doc, {
  startY: tableY + 6,
  margin: { left: marginL, right: marginR },
  theme: 'plain',              // ปิดเส้นทั้งหมด
  head: [[
    { content: "ชื่อบริษัทประกันภัย", styles: { halign: "center" } },
    { content: "จำนวนเงิน (บาท)",     styles: { halign: "center" } },
    { content: "เลขที่เช็ค",           styles: { halign: "center" } },
    { content: "วันรับเช็ค",          styles: { halign: "center" } },
  ]],
  body: Array(6).fill(["", "", "", ""]),  // กี่แถวก็ปรับได้
  foot: [[
    { content: "รวม", styles: { fontStyle: "bold" } },
    "", "", ""
  ]],
  styles: {
    font:        "THSarabunNew",
    fontSize:    10,
    cellPadding: 2,
  },
  columnStyles: {
    0: { cellWidth: colWidths[0], halign: "left"   },
    1: { cellWidth: colWidths[1], halign: "right"  },
    2: { cellWidth: colWidths[2], halign: "center" },
    3: { cellWidth: colWidths[3], halign: "center" },
  },
  didDrawCell: (data) => {
    const { cell, section, column } = data;
    const x1 = cell.x;
    const x2 = cell.x + cell.width;
    const y1 = cell.y;
    const y2 = cell.y + cell.height;

    doc.setDrawColor(0);
    doc.setLineWidth(0.1);

    // เส้นตั้งที่ขอบขวาของทุก cell
    doc.line(x2, y1, x2, y2);
    doc.line(x1, y2, x1, y1);

    // ขอบล่างของ header (แถวเดียว)
    if (section === 'head' && column.index === 0) {
      doc.line(marginL, y2, marginL + tableW, y2);
    }
    // 2) ขอบบนของ header (วาดแค่ครั้งเดียว เมื่อ column.index=0)
    if (section === "head" && column.index === 0) {
      doc.line(marginL, y1, marginL + tableW, y1);
    }

    // ขอบบนของ footer (แถว “รวม”)
    if (section === 'foot' && column.index === 0) {
      doc.line(marginL, y1, marginL + tableW, y1);
    }
    if (section === "foot" && column.index === 0) {
      doc.line(marginL, y2, marginL + tableW, y2);
    }
  }
});
const tableEndY = (doc as any).lastAutoTable.finalY-74;
const marginAfterTable = 10;   // เว้นช่อง 10 มม. จากจบตาราง
const boxW  = 50;              // กว้างกล่อง
const boxH  = 30;              // สูงกล่อง (อยาก fix กี่มม.ก็ได้)
const gap   = 4;               // ช่องว่างระหว่างกล่องบนกับล่าง
const boxX  = 150;             // X ของกล่องทั้งสอง (ปรับตาม layout)

// Y ของกล่องบน
const box1Y = tableEndY + marginAfterTable;
// Y ของกล่องล่าง
const box2Y = box1Y + boxH + gap;
// — กล่องฝ่ายบัญชี (บน) —
doc.setLineWidth(0.2).setDrawColor(0);
doc.rect(boxX, box1Y, boxW, boxH);
doc.setFont("THSarabunNew","bold").setFontSize(11);
doc.text("ฝ่ายบัญชี", boxX + boxW/2, box1Y + 6, { align:"center" });
// เส้นเซ็นใต้หัวกล่อง
doc.setLineWidth(0.4);
doc.line(boxX, box1Y + 8, boxX + boxW, box1Y + 8);
// วันที่ใต้เส้น
doc.setFont("THSarabunNew","normal").setFontSize(10);
doc.text("วันที่ ........ / ........ / ........", boxX + 12, box1Y + boxH - 6);

// — กล่องฝ่ายการเงิน (ล่าง) —
doc.rect(boxX, box2Y, boxW, boxH);
doc.setFont("THSarabunNew","bold").setFontSize(11);
doc.text("ฝ่ายการเงิน", boxX + boxW/2, box2Y + 6, { align:"center" });
// เส้นเซ็นใต้หัวกล่อง
doc.setLineWidth(0.4);
doc.line(boxX, box2Y + 8, boxX + boxW, box2Y + 8);
doc.setFont("THSarabunNew","normal").setFontSize(10);
doc.text("วันที่ ........ / ........ / ........", boxX + 12, box2Y + boxH - 6);

  return doc;
}
