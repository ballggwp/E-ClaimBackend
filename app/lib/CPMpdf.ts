// --- lib/CPMpdf.ts ---
import jsPDF from "jspdf";
import fontBase64 from "@/app/fonts/THSarabunNew.base64";
import fontBase64Bold from "@/app/fonts/THSarabunNew Bold.base64";
import { th } from "date-fns/locale";
import { format, parseISO } from "date-fns";
export interface CPMFormPDFData {
  signerPosition: string;
  docNum: string;
  phoneNum: string;
  department: string;
  approverName: string;
  signerName: string;
  approverPosition: string;
  approverDepartment: string;
  createdByName: string;
  accidentDate: string;
  accidentTime: string;
  location: string;
  cause: string;
  repairShop?: string;
  repairShopLocation?: string;
  policeDate?: string;
  policeTime?: string;
  policeStation?: string;
  damageOwnType: string;
  damageOtherOwn?: string;
  damageDetail?: string;
  damageAmount?: number;
  victimDetail?: string;
  partnerName?: string;
  partnerPhone?: string;
  partnerLocation?: string;
  partnerDamageDetail?: string;
  partnerDamageAmount?: number;
  partnerVictimDetail?: string;
  position: string;
  createdAt: string;
}

export function createCPMFormPDF(data: CPMFormPDFData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.addFileToVFS("THSarabunNew.ttf", fontBase64);
  doc.addFileToVFS("THSarabunNew Bold.ttf", fontBase64Bold);
  doc.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
  doc.addFont("THSarabunNew Bold.ttf", "THSarabunNew", "Bold");

  // Outer border
  doc.setLineWidth(0.5);
  doc.rect(8, 8, 194, 280);

  // Title
  doc.setFont("THSarabunNew", "Bold");
  doc.setFontSize(24);
  doc.text("แบบฟอร์มแจ้งอุบัติเหตุ", 105, 20, { align: "center" });

  // Subtitle
  doc.setFontSize(20);
  const subtitle = `เรียน ${data.signerPosition} ผ่าน ${data.approverPosition}`;
  doc.text(doc.splitTextToSize(subtitle, 178), 15, 35);

  // Starting y after header
  let y = 50;
  doc.setFontSize(18);
  doc.text("1. ลักษณะอุบัติเหตุ", 10, y);
  y += 8;
  doc.setFontSize(16);
  doc.setFont("THSarabunNew", "normal");
  const accidentDateStr = data.accidentDate
    ? (() => {
        const [y, m, d] = data.accidentDate.split("-");
        return new Date(+y, +m - 1, +d).toLocaleDateString("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      })()
    : "–";
  // Date / Time / Location
  // 1) วันที่และเวลาเกิดเหตุ (แยกสีได้)
  doc.setFont("THSarabunNew", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text("วันที่เกิดเหตุ:", 10, y);

  // วัน = สีน้ำเงิน
  const dateVal = accidentDateStr || "–";
  doc.setTextColor(0, 0, 255);
  doc.text(dateVal, 30, y);
  const dateW = doc.getTextWidth(dateVal);

  // “ เวลาเกิดเหตุ:” = สีดำ
  const timeLabel = " เวลาเกิดเหตุ:";
  doc.setTextColor(0, 0, 0);
  doc.text(timeLabel, 30 + dateW + 2, y);
  const labelW = doc.getTextWidth(timeLabel);

  // ค่าของเวลา = สีน้ำเงิน
  const timeVal = data.accidentTime ? data.accidentTime + " น." : "–";
  doc.setTextColor(0, 0, 255);
  doc.text(timeVal, 30 + dateW + 2 + labelW + 2, y);

  y += 8;

  // 2) สถานที่เกิดเหตุ (เดิม)
  doc.setTextColor(0, 0, 0);
  doc.text("สถานที่เกิดเหตุ:", 10, y);
  doc.setTextColor(0, 0, 255);
  doc.text(data.location || "–", 35, y);
  y += 8;
  doc.setFont("THSarabunNew", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text("สาเหตุของอุบัติเหตุ", 10, y);
  doc.setFont("THSarabunNew", "normal");
  doc.setTextColor(0, 0, 255);
  const causeLines = doc.splitTextToSize(data.cause || "-", 160);

  doc.text(causeLines, 40, y);
  y += 8;
  y += 8;
  y += 4;

  doc.setFontSize(18);
  doc.setFont("THSarabunNew", "Bold");
  doc.setTextColor(0, 0, 0);
  doc.text(
    "2.แผนผังที่เกิดเหตุพร้อมภาพถ่าย(โปรดแนบมาพร้อมรายงานฉบับนี้)",
    10,
    y
  );
  y += 8;
  y += 4;
  doc.setFontSize(18);
  doc.setFont("THSarabunNew", "Bold");
  doc.setTextColor(0, 0, 0);
  doc.text(
    "3.การแจ้งความต่อเจ้าหน้าที่ตำรวจ(โปรดแนบสำเนาบันทึกประจำวัน หากมี)",
    10,
    y
  );
  y += 8;
  doc.setFontSize(16);
  const policeDateStr = data.policeDate
    ? (() => {
        const [y, m, d] = data.policeDate.split("-");
        return new Date(+y, +m - 1, +d).toLocaleDateString("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      })()
    : "–";
  const required2: [string, string][] = [
    ["วันที่ที่แจ้งความ:  ", "วันที่ " + policeDateStr || "–"],
    ["เวลา:", (data.policeTime || "–") + " น."],
    ["สถานีตำรวจ:", data.policeStation || "–"],
  ];
  let x = 10;
  let a = 1;
  for (const [label, val] of required2) {
    if (a == 2) {
      x = 50;
    }
    if (a >= 2) {
      x += 35;
    }
    doc.setFont("THSarabunNew", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(label, x, y);
    doc.setFont("THSarabunNew", "normal");
    doc.setTextColor(0, 0, 255);
    if (a == 2) {
      doc.text(val, x + 15, y);
    } else if (a == 3) {
      doc.text(val, x + 25, y);
    } else {
      doc.text(val, x + 30, y);
    }
    a++;
  }
  y += 8;
  y += 4;
  // Section 4: Damage details
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "Bold");
  doc.text("4. ความเสียหายของทรัพย์สิน", 10, y);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  let type = "";
  if (data.damageOwnType == "mitrphol") {
    type = "ทรัพย์สินของกลุ่มมิตรผล";
  } else {
    type = data.damageOwnType;
  }
  doc.text(`ประเภท: ${type || "–"}`, 70, y);
  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`4.1 รายละเอียดความเสียหายของทรัพย์สิน`, 10, y);
  y += 8;
  doc.setFont("THSarabunNew", "normal");
  doc.setTextColor(0, 0, 255);
  const causedatail = doc.splitTextToSize(data.damageDetail || "-", 200);

  doc.text(causedatail, 10, y);
  y += 8;
  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`มูลค่าความเสียหายโดยประมาณ`, 10, y);
  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`${data.damageAmount?.toFixed(2) || "–"} บาท `, 60, y);
  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`4.2 รายละเอียดผู้เสียชีวิต/ผู้บาดเจ็บ(หากมี)`, 10, y);
  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`${data.victimDetail || "–"} `, 80, y);
  y += 8;
  y += 4;
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "Bold");
  doc.text("5. ความเสียหายของทรัพย์สินคู่กรณี(หากมี)", 10, y);
  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.setFontSize(16);
  doc.text(`ชื่อ/นามสกุล(หรือชื่อบริษัท)`, 10, y);
  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`${data.partnerName || "–"} `, 60, y);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`โทร`, 120, y);
  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`${data.partnerPhone || "–"} `, 130, y);
  y += 8;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`ที่อยู่`, 10, y);
  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`${data.partnerLocation || "–"} `, 30, y);
  y += 8;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`5.1 รายละเอียดความเสียหาย`, 10, y);

  doc.setFont("THSarabunNew", "normal");
  doc.setTextColor(0, 0, 255);
  const partnerDamagedatail = doc.splitTextToSize(
    data.partnerDamageDetail || "-",
    130
  );

  y += 8;
  doc.text(partnerDamagedatail, 10, y);
  y += 8;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`มูลค่าความเสียหาย`, 10, y);

  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`${data.partnerDamageAmount || "–"} `, 45, y);
  y += 8;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`รายละเอียดผู้เสียชีวิต / ผู้บาดเจ็บ(ถ้ามี)`, 10, y);
  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`${data.partnerVictimDetail || "–"} `, 75, y);
  y += 8;
  y += 4;

  // Section 6: Reporter signature
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "Bold");
  doc.text(`6.ผู้รายงาน`, 10, y);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`ชื่อ / นามสกุล`, 35, y);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`${data.approverName || "–"} `, 60, y);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`ตำแหน่ง`, 110, y);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`${data.approverPosition || "–"} `, 130, y);
  y += 8;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`หน่วยงาน`, 10, y);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`${data.approverDepartment || "–"} `, 30, y);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`เบอร์ติดต่อ`, 110, y);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 255);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`${data.phoneNum || "–"} `, 130, y);
  y += 8;
  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("THSarabunNew", "normal");
  doc.text(`ฝ่ายประกันกลุ่ม บริษัท น้ำตาลมิตรผล จำกัด`, 10, y);
  y += 8;
  console.log(y);
  doc.text(`โทร 02-794-1000 ต่อ 620 หรือ 260`, 10, y);
  y = 265;
  doc.setFontSize(16);
  const prefix = "ลงชื่อ ";
  const name = data.approverName;
  const suffix = " ผู้รายงาน";

  // 1) prefix in black
  doc.setFont("THSarabunNew", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(prefix, 120, y);
  const prefixWidth = doc.getTextWidth(prefix);

  // 2) name in blue
  doc.setTextColor(0, 0, 255);
  doc.text(name, 120 + prefixWidth, y);
  const nameWidth = doc.getTextWidth(name);

  // 3) suffix in black
  doc.setTextColor(0, 0, 0);
  doc.text(suffix, 120 + prefixWidth + nameWidth, y);
  y += 8;
  doc.text(`(${data.approverName})`, 130, y);
  y += 8;
  const [datePart] = data.createdAt.split(" ");
  const parsed = new Date(datePart);

  // format with Thai+Buddhist calendar + “พ.ศ.” era
  const createdAtDate = parsed.toLocaleDateString("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "short",
    year: "numeric", // → “พ.ศ.”
  });

  // e.g. “2 กรกฎาคม พ.ศ. 2568”
  doc.setFont("THSarabunNew", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`วันที่ ${createdAtDate}`, 135, y);

  return doc;
}
