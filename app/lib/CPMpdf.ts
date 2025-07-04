// --- lib/CPMpdf.ts ---
import jsPDF from "jspdf";
import fontBase64 from "@/app/fonts/THSarabunNew.base64";
import fontBase64Bold from "@/app/fonts/THSarabunNew Bold.base64";
import { th } from 'date-fns/locale';
import { format } from 'date-fns';
export interface CPMFormPDFData {
  docNum: string;
  department:string;
  approverName: string;
  signerName: string;
  approverPosition: string;
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
  position:string;
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
  const subtitle = "เรียน รองกรรมการผู้จัดการใหญ่ กลุ่มการเงิน ผ่าน ";
  doc.text(doc.splitTextToSize(subtitle, 178), 15, 35);
  if (data.approverPosition) {
    doc.text(data.approverPosition, 110, 35);
  }

  // Starting y after header
  let y = 50;
  doc.setFontSize(18);
  doc.text("1. ลักษณะอุบัติเหตุ", 10, y);
  y += 8;
  doc.setFontSize(16);
    doc.setFont("THSarabunNew", "normal"); 
const accidentDateStr = data.accidentDate
    ? (() => {
        const [y, m, d] = data.accidentDate.split('-');
        return new Date(+y, +m - 1, +d).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
      })()
    : '–';
  // Date / Time / Location
   const required: [string, string][] = [
    ["วันที่เกิดเหตุ:  ", "วันที่ "+accidentDateStr || "–"],
    ["เวลาเกิดเหตุ:",( data.accidentTime || "–") + " น."],
    ["สถานที่เกิดเหตุ:", data.location || "–"],
    ["สาเหตุของอุบัติเหตุ",data.cause||"-"]
  ];
  for (const [label, val] of required) {
    doc.setFont("THSarabunNew", "normal"); doc.setTextColor(0, 0, 0);
    doc.text(label, 10, y);
    doc.setFont("THSarabunNew", "normal"); doc.setTextColor(0, 0, 255);
    doc.text(val, 60, y);
    y += 8;
  }
  y+=2

  doc.setFontSize(18);
  doc.setFont("THSarabunNew", "Bold"); doc.setTextColor(0, 0, 0);
  doc.text("2.แผนผังที่เกิดเหตุพร้อมภาพถ่าย(โปรดแนบมาพร้อมรายงานฉบับนี้)", 10, y);
  y += 8;
  y+=2
  doc.setFontSize(18);
  doc.setFont("THSarabunNew", "Bold"); doc.setTextColor(0, 0, 0);
  doc.text("3.การแจ้งความต่อเจ้าหน้าที่ตำรวจ(โปรดแนบสำเนาบันทึกประจำวัน หากมี)", 10, y);
  y += 8;
  doc.setFontSize(16);
  const policeDateStr = data.policeDate
    ? (() => {
        const [y, m, d] = data.policeDate.split('-');
        return new Date(+y, +m - 1, +d).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
      })()
    : '–';
  const required2: [string, string][] = [
    ["วันที่ที่แจ้งความ:  ", "วันที่ "+policeDateStr || "–"],
    ["เวลา:", (data.policeTime || "–") + " น."],
    ["สถานีตำรวจ:", data.policeStation || "–"],
  ];
  let x=10
  let a=1;
  for (const [label, val] of required2) {
    if(a==2)
    {
      x=50
    }
    if(a>=2)
    {
      x+=35
    }
    doc.setFont("THSarabunNew", "normal"); doc.setTextColor(0, 0, 0);
    doc.text(label, x, y);
    doc.setFont("THSarabunNew", "normal"); doc.setTextColor(0, 0, 255);
     if(a==2)
    {
      doc.text(val, x+15, y);
    }
    else if(a==3)
    {
      doc.text(val, x+25, y);
    }
    else{
      doc.text(val, x+30, y);
    }
    a++
  }
  y+=8
  y+=2
  // Section 4: Damage details
  doc.setFontSize(18); doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "Bold")
  doc.text("4. ความเสียหายของทรัพย์สิน", 10, y);
  doc.setFontSize(16); doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  let type="";
  if(data.damageOwnType=="mitrphol")
    {
      type="ทรัพย์สินของกลุ่มมิตรผล"
    }
    else{
      type = data.damageOwnType; 
    }
  doc.text(`ประเภท: ${type || "–"}`, 70, y);
  y += 8;
  doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
  doc.text(`4.1 มูลค่าความเสียหายของทรัพย์สิน`, 10, y);
  y += 8;
  doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.damageDetail || "–"}`, 10, y);
  y += 8;
  doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
  doc.text(`มูลค่าความเสียหายโดยประมาณ`, 10, y);
  doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.damageAmount?.toFixed(2) || "–"} บาท `, 60, y);
    y += 8;
    doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
  doc.text(`4.2 รายละเอียดผู้เสียชีวิต/ผู้บาดเจ็บ(หากมี)`, 10, y);
  doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.victimDetail || "–"} `, 80, y);
    y += 8;
    y += 2;
  doc.setFontSize(18); doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "Bold")
  doc.text("5. ความเสียหายของทรัพย์สินคู่กรณี(หากมี)", 10, y);
    y += 8;
    doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
    doc.setFontSize(16);
    doc.text(`ชื่อ/นามสกุล(หรือชื่อบริษัท)`, 10, y);
  doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.partnerName || "–"} `, 60, y);
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
  doc.text(`โทร`, 120, y);
  doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.partnerPhone || "–"} `, 130, y);
  y += 8;
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
  doc.text(`ที่อยู่`, 10, y);
  doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.partnerLocation || "–"} `, 30, y);
  y += 8;
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
  doc.text(`5.1 รายละเอียดความเสียหาย`, 10, y);
  doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.partnerDamageDetail || "–"} `, 60, y);
  y += 8;
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
  doc.text(`มูลค่าความเสียหาย`, 10, y);
  doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.partnerDamageAmount || "–"} `, 45, y);
  y += 8;
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
  doc.text(`รายละเอียดผู้เสียชีวิต / ผู้บาดเจ็บ(ถ้ามี)`, 10, y);
  doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.partnerVictimDetail || "–"} `, 75, y);
  y += 8;


// Section 6: Reporter signature
  doc.setFontSize(18); doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "Bold")
  doc.text(`6.ผู้รายงาน`, 10, y);
   doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
  doc.text(`ชื่อ / นามสกุล`, 35, y);
  doc.setFontSize(16); doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.createdByName || "–"} `, 60, y);
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
  doc.text(`ตำแหน่ง`, 100, y);
  doc.setFontSize(16); doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.position || "–"} `, 120, y);
  y += 8;
  doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.setFont("THSarabunNew", "normal")
  doc.text(`หน่วยงาน`, 10, y);
  doc.setFontSize(16); doc.setTextColor(0, 0, 255); doc.setFont("THSarabunNew", "normal")
  doc.text(`${data.department || "–"} `, 30, y);
  y += 8;



  


  return doc;
}
