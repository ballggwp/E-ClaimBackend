// components/FPPA04Form.tsx
"use client";

import { useParams } from "next/navigation";
import React, { ChangeEvent, FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

export interface FPPA04FormItem {
  category: string;
  description: string;
  total: string;
  exception: string;
}

export interface FPPA04Adjustment {
  type: "บวก" | "หัก";
  description: string;
  amount: string;
}

export interface FPPA04FormValues {
  eventType: string;
  claimRefNumber: string;
  eventDescription: string;
  productionYear: string;
  accidentDate: string;
  reportedDate: string;
  receivedDocDate: string;
  company: string;
  factory: string;
  policyNumber: string;
  surveyorRefNumber: string;
  items: FPPA04FormItem[];
  adjustments: FPPA04Adjustment[];
  signatureFiles: File[];
}

interface Props {
  defaults: {
    accidentDate?: string;
    status: string;
    cause: string;
    approverName: string;
  };
  initialData?: FPPA04FormValues;
  onSave: () => void;
}

export default function FPPA04Form({ defaults, initialData, onSave }: Props) {
  const { claimId } = useParams();
  const canEdit = defaults.status === "PENDING_INSURER_FORM";
  const { data: session } = useSession();

  // initialize state
  const [vals, setVals] = useState<FPPA04FormValues>(() => ({
    eventType: initialData?.eventType || "",
    claimRefNumber: initialData?.claimRefNumber || "",
    eventDescription: initialData?.eventDescription || "",
    productionYear: initialData?.productionYear || new Date().getFullYear().toString(),
    accidentDate: initialData?.accidentDate || "",
    reportedDate: initialData?.reportedDate || "",
    receivedDocDate: initialData?.receivedDocDate || "",
    company: initialData?.company || "",
    factory: initialData?.factory || "",
    policyNumber: initialData?.policyNumber || "",
    surveyorRefNumber: initialData?.surveyorRefNumber || "",
    items: initialData?.items || [],
    adjustments: initialData?.adjustments || [],
    signatureFiles: [],
  }));

  // handlers preventing edit when not allowed
  const handleField = (e: ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    if (!canEdit) return;
    const { name, value } = e.target;
    setVals(v => ({ ...v, [name]: value }));
  };

  const changeItem = (i: number, k: keyof FPPA04FormItem, v: string) => {
    if (!canEdit) return;
    setVals(vs => {
      const items = [...vs.items];
      items[i] = { ...items[i], [k]: v };
      return { ...vs, items };
    });
  };
  const addItem = () => canEdit && setVals(vs => ({ ...vs, items: [...vs.items, { category: "", description: "", total: "", exception: "" }] }));
  const delItem = (i: number) => canEdit && setVals(vs => ({ ...vs, items: vs.items.filter((_,idx) => idx!==i) }));

  const changeAdj = (i: number, k: keyof FPPA04Adjustment, v: string) => {
    if (!canEdit) return;
    setVals(vs => {
      const a = [...vs.adjustments];
      a[i] = { ...a[i], [k]: v };
      return { ...vs, adjustments: a };
    });
  };
  const addAdj = () => canEdit && setVals(vs => ({ ...vs, adjustments: [...vs.adjustments, { type: "บวก", description: "", amount: "" }] }));
  const delAdj = (i: number) => canEdit && setVals(vs => ({ ...vs, adjustments: vs.adjustments.filter((_,idx) => idx!==i) }));

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const files = e.target.files;
    if (!files) return;
    setVals(vs => ({ ...vs, signatureFiles: [...vs.signatureFiles, ...Array.from(files)] }));
  };

  // calculate sums
  const totalSum = vals.items.reduce((s,i) => s + parseFloat(i.total||"0"), 0);
  const exceptionSum = vals.items.reduce((s,i) => s + parseFloat(i.exception||"0"), 0);
  const coverageSum = totalSum - exceptionSum;
  const plusSum = vals.adjustments.filter(a => a.type === "บวก").reduce((s,a) => s + parseFloat(a.amount||"0"), 0);
  const minusSum = vals.adjustments.filter(a => a.type === "หัก").reduce((s,a) => s + parseFloat(a.amount||"0"), 0);
  const finalNet = coverageSum + plusSum - minusSum;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'ยืนยันจะส่งข้อมูลแบบฟอร์มหรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ส่งเลย',
      cancelButtonText: 'ยกเลิก'
    });
    if (!result.isConfirmed) return;

    const fd = new FormData();
    (["eventType","claimRefNumber","eventDescription","productionYear","accidentDate","reportedDate","receivedDocDate","company","factory","policyNumber","surveyorRefNumber"] as const)
      .forEach(k => fd.append(k, vals[k]));
    vals.items.forEach(i => fd.append("items", JSON.stringify(i)));
    vals.adjustments.forEach(a => fd.append("adjustments", JSON.stringify(a)));
    vals.signatureFiles.forEach(f => fd.append("signatureFiles", f));
    fd.append("netAmount", finalNet.toFixed(2));

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04/${claimId}`,
      { method: "POST", headers: { Authorization: `Bearer ${session?.user.accessToken}` }, body: fd }
    );
    if (!res.ok) return Swal.fire('Error', await res.text(), 'error');
    onSave();
  };

  const inputClass = (editable: boolean) =>
    `w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm focus:outline-none transition ${editable ? 'bg-white' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`;

  return (
    <form onSubmit={onSubmit} className="space-y-8">

      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-1 font-medium">เลขที่ฟอร์ม</label>
          <input readOnly value={claimId} className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-50" />
        </div>
        <div>
          <label className="block mb-1 font-medium">สาเหตุของอุบัติเหตุ</label>
          <textarea readOnly value={defaults.cause} className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-50" />
        </div>
      </div>

      {/* Policy & Claim Ref */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-1 font-medium">ประเภทกรมธรรม์</label>
          <input
            name="eventType"
            value={vals.eventType}
            onChange={handleField}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">หมายเลขรับ Claim</label>
          <input
            name="claimRefNumber"
            value={vals.claimRefNumber}
            onChange={handleField}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
      </div>

      {/* Event Description */}
      <div>
        <label className="block mb-1 font-medium">เหตุการณ์</label>
        <textarea
          name="eventDescription"
          value={vals.eventDescription}
          onChange={handleField}
          disabled={!canEdit}
          className={`${inputClass(canEdit)} h-24`}
        />
      </div>

      {/* Dates & Company/Factory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-1 font-medium">ปีรถที่ผลิต</label>
          <input
            name="productionYear"
            type="number"
            value={vals.productionYear}
            onChange={handleField}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">วันที่เกิดเหตุ</label>
          <input
            name="accidentDate"
            type="date"
            value={vals.accidentDate}
            onChange={handleField}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-1 font-medium">วันที่รับแจ้ง</label>
          <input
            name="reportedDate"
            type="date"
            value={vals.reportedDate}
            onChange={handleField}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">วันที่ได้รับเอกสาร</label>
          <input
            name="receivedDocDate"
            type="date"
            value={vals.receivedDocDate}
            onChange={handleField}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
      </div>

      {/* Company & Factory & Approver */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">  
        <div>
          <label className="block mb-1 font-medium">บริษัท</label>
          <input
            name="company"
            value={vals.company}
            onChange={handleField}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">โรงงาน</label>
          <input
            name="factory"
            value={vals.factory}
            onChange={handleField}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">ผู้อนุมัติเอกสาร</label>
          <input
            readOnly
            value={defaults.approverName}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-50"
          />
        </div>
      </div>

      {/* Policy Number & Surveyor Ref */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-1 font-medium">เลขที่กรมธรรม์</label>
          <input
            name="policyNumber"
            value={vals.policyNumber}
            onChange={handleField}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">เลขที่ Claim Surveyor</label>
          <input
            name="surveyorRefNumber"
            value={vals.surveyorRefNumber}
            onChange={handleField}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
      </div>

      {/* Items Table */}
      <div>
        <h3 className="font-semibold mb-2">รายการแจ้งเคลมประกัน</h3>
        <div className="overflow-auto max-h-64">
          <table className="w-full table-fixed border-collapse border border-blue-200">
            <colgroup><col className="w-1/5"/><col className="w-2/5"/><col className="w-1/5"/><col className="w-1/5"/><col className="w-1/5"/></colgroup>
            <thead className="bg-blue-50 sticky top-0">
              <tr>
                <th className="px-2 py-1 border-blue-200 text-center text-sm">รายการ</th>
                <th className="px-2 py-1 border-blue-200 text-center text-sm">รายละเอียด</th>
                <th className="px-2 py-1 border-blue-200 text-center text-sm">รวม</th>
                <th className="px-2 py-1 border-blue-200 text-center text-sm">ข้อยกเว้น</th>
                <th className="px-2 py-1 border-blue-200 text-center text-sm">คุ้มครอง</th>
              </tr>
            </thead>
            <tbody>
              {vals.items.map((it,idx)=>{
                const cover = (parseFloat(it.total||"0") - parseFloat(it.exception||"0")).toFixed(2);
                return (
                  <tr key={idx} className="hover:bg-blue-100">
                    <td className="p-1 border border-blue-200">
                      <input
                        type="text"
                        placeholder="..."
                        value={it.category}
                        onChange={e=>changeItem(idx,"category",e.target.value)}
                        disabled={!canEdit}
                        className={inputClass(canEdit)}
                      />
                    </td>
                    <td className="p-1 border border-blue-200">
                      <input
                        type="text"
                        placeholder="..."
                        value={it.description}
                        onChange={e=>changeItem(idx,"description",e.target.value)}
                        disabled={!canEdit}
                        className={inputClass(canEdit)}
                      />
                    </td>
                    <td className="p-1 border border-blue-200">
                      <input
                        type="number"
                        step="0.01"
                        value={it.total}
                        onChange={e=>changeItem(idx,"total",e.target.value)}
                        disabled={!canEdit}
                        className={inputClass(canEdit)}
                      />
                    </td>
                    <td className="p-1 border border-blue-200">
                      <input
                        type="number"
                        step="0.01"
                        value={it.exception}
                        onChange={e=>changeItem(idx,"exception",e.target.value)}
                        disabled={!canEdit}
                        className={inputClass(canEdit)}
                      />
                    </td>
                    <td className="p-1 border border-blue-200 text-right">{cover}</td>
                    {canEdit && <td className="p-1 border border-blue-200 text-center text-red-600 cursor-pointer" onClick={()=>delItem(idx)}>✖</td>}
                  </tr>
                );
              })}
              <tr className="bg-blue-50 font-semibold text-xs">
                <td colSpan={2} className="p-1 border border-blue-200 text-right">รวม</td>
                <td className="p-1 border border-blue-200 text-right">{totalSum.toFixed(2)}</td>
                <td className="p-1 border border-blue-200 text-right">{exceptionSum.toFixed(2)}</td>
                <td className="p-1 border border-blue-200 text-right">{coverageSum.toFixed(2)}</td>
                {canEdit && <td className="border border-blue-200"></td>}
              </tr>
            </tbody>
          </table>
          {canEdit && <button type="button" onClick={addItem} className="text-blue-600 hover:underline text-xs mt-2">+ เพิ่มรายการ</button>}
        </div>
      </div>

<hr className="my-6 border-t border-blue-200" />

{/* ตารางรายการบวก/หัก */}
      <div className="overflow-auto max-h-48">
        <table className="w-full table-fixed border-collapse border border-blue-200">
          <caption className="sr-only">รายการบวก/หัก</caption>
          <colgroup><col className="w-2/6"/><col className="w-3/6"/><col style={{width:'100px'}}/></colgroup>
          <thead className="bg-blue-50 sticky top-0">
            <tr>
              {['บวก/หัก','รายละเอียด','จำนวนเงิน (บาท)'].map((h,i)=> (
                <th key={i} className="px-2 py-1 border border-blue-200 text-center text-blue-800 text-sm">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vals.adjustments.map((a,idx)=>(
              <tr key={idx} className={`hover:bg-blue-100 ${!canEdit?'opacity-50':''}`}>
                <td className="p-1 border border-blue-200 text-center">
                  <select
                    value={a.type}
                    onChange={e=>changeAdj(idx,'type',e.target.value)}
                    disabled={!canEdit}
                    className={inputClass(canEdit)}
                  >
                    <option value="บวก">บวก</option>
                    <option value="หัก">หัก</option>
                  </select>
                </td>
                <td className="p-1 border border-blue-200">
                  <input
                    type="text"
                    placeholder="รายละเอียด"
                    value={a.description}
                    onChange={e=>changeAdj(idx,'description',e.target.value)}
                    disabled={!canEdit}
                    className={inputClass(canEdit)}
                  />
                </td>
                <td className="p-1 border border-blue-200 relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={a.amount}
                    onChange={e=>changeAdj(idx,'amount',e.target.value)}
                    disabled={!canEdit}
                    className={inputClass(canEdit)}
                  />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={()=>delAdj(idx)}
                      className="absolute top-1/2 right-1 transform -translate-y-1/2 text-red-600 hover:text-red-800 text-sm"
                      aria-label="ลบรายการปรับ"
                    >✖</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {canEdit && (
          <button
            type="button"
            onClick={addAdj}
            className="text-blue-600 hover:underline text-xs mt-2"
          >+ เพิ่มรายการปรับ</button>
        )}
      </div>

      {/* สรุปยอดสุทธิ */}
      <div className="flex justify-end items-baseline space-x-2">
        <span className="font-semibold">เงินรับค่าสินไหมสุทธิ:</span>
        <input readOnly value={finalNet.toFixed(2)} className="w-32 text-right bg-blue-50 border border-blue-200 rounded px-3 py-2" />
        <span>บาท</span>
      </div>

      <input type="hidden" name="netAmount" value={finalNet.toFixed(2)} />

      {/* Signature upload */}
      <div>
        <label className="block mb-1 font-medium">Signature Files</label>
        <input type="file" multiple onChange={onFile} disabled={!canEdit} className={inputClass(canEdit)} />
      </div>

      {/* Submit */}
      {canEdit && (
        <div className="text-right">
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">
            บันทึก FPPA04
          </button>
        </div>
      )}
    </form>
  );
}