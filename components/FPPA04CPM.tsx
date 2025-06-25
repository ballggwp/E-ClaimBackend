// components/FPPA04CPMForm.tsx
"use client";

import { useParams } from "next/navigation";
import React, { ChangeEvent, FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import router from "next/router";

export interface FPPA04CPMFormItem {
  category: string;
  description: string;
  total: string;
  exception: string;
}

export interface FPPA04CPMAdjustment {
  type: "บวก" | "หัก";
  description: string;
  amount: string;
}

export interface FPPA04CPMFormValues {
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
  items: FPPA04CPMFormItem[];
  adjustments: FPPA04CPMAdjustment[];
  signatureFiles: File[];
}

interface Props {
  defaults: {
    accidentDate?: string;
    status: string;
    cause: string;
    approverName: string;
  };
  initialData?: FPPA04CPMFormValues;
  onSave: () => void;
}

export default function FPPA04Form({ defaults, initialData, onSave }: Props) {
  const { claimId } = useParams();
  const canEdit = defaults.status === "PENDING_INSURER_FORM";
  const { data: session } = useSession();
  const isManager = session?.user.role === "MANAGER";
  const canReviewManager = isManager && defaults.status === "PENDING_MANAGER_REVIEW";

  // initialize state
  const [vals, setVals] = useState<FPPA04CPMFormValues>(() => ({
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
  const ManagerAction = async (action: "approve" | "reject") => {
    const { value: comment } = await Swal.fire({
      title: action === "approve" ? "อนุมัติแบบฟอร์ม?" : "ปฏิเสธแบบฟอร์ม?",
      input: "textarea",
      inputLabel: "หมายเหตุ (ไม่บังคับ)",
      showCancelButton: true,
      confirmButtonText: action === "approve" ? "ใช่, อนุมัติ" : "ใช่, ปฏิเสธ",
      cancelButtonText: "ยกเลิก",
    });
    if (comment === undefined) return;
    const res = await fetch(
      `/api/claims/${claimId}/review`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        body: JSON.stringify({ action, comment }),
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      return Swal.fire("Error", txt, "error");
    }
    Swal.fire("สำเร็จ!", "ระบบอัปเดตสถานะแล้ว", "success").then(() => router.replace("/dashboard"));
  };
  // handlers preventing edit when not allowed
  const handleField = (e: ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    if (!canEdit) return;
    const { name, value } = e.target;
    setVals(v => ({ ...v, [name]: value }));
  };

  const changeItem = (i: number, k: keyof FPPA04CPMFormItem, v: string) => {
    if (!canEdit) return;
    setVals(vs => {
      const items = [...vs.items];
      items[i] = { ...items[i], [k]: v };
      return { ...vs, items };
    });
  };
  const addItem = () => canEdit && setVals(vs => ({ ...vs, items: [...vs.items, { category: "", description: "", total: "", exception: "" }] }));
  const delItem = (i: number) => canEdit && setVals(vs => ({ ...vs, items: vs.items.filter((_,idx) => idx!==i) }));

  const changeAdj = (i: number, k: keyof FPPA04CPMAdjustment, v: string) => {
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
    vals.signatureFiles.forEach(f => {
  fd.append("signatureFiles", f);   // ← each file under the same key
});
    fd.append("netAmount", finalNet.toFixed(2));

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04/${claimId}/cpm`,
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

      {/* ตารางรายการแจ้งเคลมประกัน */}
<div className="overflow-auto max-h-64">
  <table className=" table-fixed border-collapse ">
    <colgroup>
      <col className="w-1/5"/>
      <col className="w-2/5"/>
      <col className="w-1/5"/>
      <col className="w-1/5"/>
      <col className="w-1/5"/>
    </colgroup>
    <thead className="bg-blue-50 sticky top-0">
      <tr>
        {["รายการ","รายละเอียด","รวม","ข้อยกเว้น","คุ้มครอง"].map((h,i) => (
          <th
            key={i}
            className="px-2 py-1 border border-blue-200 text-center text-sm text-blue-800"
          >{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {vals.items.map((it, idx) => {
        const cover = (parseFloat(it.total||"0") - parseFloat(it.exception||"0")).toFixed(2);
        return (
          <tr key={idx} className="hover:bg-blue-100">
            {(["category","description","total","exception"] as const).map((f,ci) => (
              <td key={ci} className="px-2 py-1.5 border border-blue-200">
                <input
                  type={f==="total"||f==="exception"?"number":"text"}
                  step="0.01"
                  placeholder={f==="total"||f==="exception"?"0.00":undefined}
                  value={(it as any)[f]}
                  onChange={e=>changeItem(idx,f,e.target.value)}
                  disabled={!canEdit}
                  className="w-full border border-gray-300 px-2 py-1.5 rounded text-xs transition
                             bg-white focus:outline-none focus:ring-2 focus:ring-blue-400
                             disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                />
              </td>
            ))}
            <td className="px-2 py-1 border border-blue-200 text-right text-xs">{cover}</td>
            {canEdit && (
              <td
                className="px-2 py-1 text-center text-red-600 cursor-pointer text-xs"
                onClick={()=>delItem(idx)}
              >✖</td>
            )}
          </tr>
        );
      })}
      <tr className="bg-blue-50 font-semibold text-xs">
        <td colSpan={2} className="px-2 py-1.5 border border-blue-200 text-right">รวม</td>
        <td className="px-2 py-1.5 border border-blue-200 text-right">{totalSum.toFixed(2)}</td>
        <td className="px-2 py-1.5 border border-blue-200 text-right">{exceptionSum.toFixed(2)}</td>
        <td className="px-2 py-1.5 border border-blue-200 text-right">{coverageSum.toFixed(2)}</td>
        {canEdit && <td className="bg-white"></td>}
      </tr>
    </tbody>
  </table>
  {canEdit && (
    <button
      type="button"
      onClick={addItem}
      className="mt-2 text-blue-600 hover:underline text-xs"
    >+ เพิ่มรายการ</button>
  )}
</div>

<hr className="my-6 border-t border-blue-200" />

{/* ตารางรายการบวก/หัก */}
<div className="overflow-auto max-h-48">
  <table className="table-fixed border-collapse">
    <colgroup>
      <col className="w-1/6"/>
      <col className="w-3/6"/>
      <col className="w-2/6"/>
    </colgroup>
    <thead className="bg-blue-50 sticky top-0">
      <tr>
        {["บวก/หัก","รายละเอียด","จำนวนเงิน (บาท)"].map((h, i) => (
          <th
            key={i}
            className="px-2 py-1.5 border border-blue-200 text-center text-sm text-blue-800"
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {vals.adjustments.map((a, idx) => (
        <tr key={idx} className="hover:bg-blue-100">
          {/* บวก/หัก */}
          <td className="px-2 py-1.5 border border-blue-200 text-center text-xs">
            <select
              value={a.type}
              onChange={e => changeAdj(idx, "type", e.target.value)}
              disabled={!canEdit}
              className="w-full border border-gray-300 px-2 py-1.5 rounded text-xs transition
                         bg-white focus:outline-none focus:ring-2 focus:ring-blue-400
                         disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
            >
              <option value="บวก">บวก</option>
              <option value="หัก">หัก</option>
            </select>
          </td>
          {/* รายละเอียด */}
          <td className="px-2 py-1.5 border border-blue-200">
            <input
              type="text"
              value={a.description}
              onChange={e => changeAdj(idx, "description", e.target.value)}
              disabled={!canEdit}
              className="w-full border border-gray-300 px-2 py-1.5 rounded text-xs transition
                         bg-white focus:outline-none focus:ring-2 focus:ring-blue-400
                         disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
            />
          </td>
          {/* จำนวนเงิน */}
          <td className="px-2 py-1.5 border border-blue-200">
            <input
              type="number"
              step="0.01"
              value={a.amount}
              onChange={e => changeAdj(idx, "amount", e.target.value)}
              disabled={!canEdit}
              className="w-full border border-gray-300 px-2 py-1.5 rounded text-xs transition
                         bg-white focus:outline-none focus:ring-2 focus:ring-blue-400
                         disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
            />
          </td>
          {/* ปุ่มลบ */}
          {canEdit && (
            <td
              className="px-2 py-1 text-center text-red-600 cursor-pointer text-sm"
              onClick={() => delAdj(idx)}
            >
              ✖
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
  {canEdit && (
    <button
      type="button"
      onClick={addAdj}
      className="mt-2 text-blue-600 hover:underline text-xs"
    >
      + เพิ่มรายการปรับ
    </button>
  )}
</div>

      {/* สรุปยอดสุทธิ */}
      <div className="flex justify-end items-baseline space-x-2">
        <span className="font-semibold">เงินรับค่าสินไหมสุทธิ:</span>
        <input readOnly value={finalNet.toFixed(2)} className="w-32 text-right bg-blue-50 border border-blue-200 rounded px-2 py-1.5 block mb-1 font-medium" />
        <span>บาท</span>
      </div>

      <input type="hidden" name="netAmount" value={finalNet.toFixed(2)} />

      {/* Signature upload */}
<div>
  <label className="block mb-1 font-medium">Signature Files</label>
  <input
    type="file"
    multiple
    name="signatureFiles"
    onChange={onFile}
    disabled={!canEdit}
    className={inputClass(canEdit)}
  />

  {/* Preview gallery */}
  <div className="mt-3 grid grid-cols-4 gap-2">
    {vals.signatureFiles.map((file, idx) => {
      const isImage = file.type.startsWith('image/');
      const sizeKB = (file.size / 1024).toFixed(1);
      return (
        <div key={idx} className="relative p-2 border rounded bg-white">
          {isImage ? (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-full h-24 object-contain mb-1"
            />
          ) : (
            <div className="flex items-center justify-center h-24 text-4xl mb-1">
              📄
            </div>
          )}
          <div className="text-xs text-gray-700 truncate">
            {file.name}
          </div>
          <div className="text-xs text-gray-500">
            {sizeKB} KB
          </div>
          <button
            type="button"
            onClick={() => {
              setVals(v => {
                const sigs = [...v.signatureFiles];
                sigs.splice(idx, 1);
                return { ...v, signatureFiles: sigs };
              });
            }}
            className="absolute top-1 right-1 text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      );
    })}
  </div>
</div>
      {/* Submit */}
      {canEdit && (
        <div className="text-right">
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">
            บันทึก FPPA04
          </button>
        </div>
      )}
      {canReviewManager && (
        <div className="flex justify-end space-x-2 mb-4">
          <button
            onClick={() => ManagerAction('reject')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >ปฏิเสธ</button>
          <button
            onClick={() => ManagerAction('approve')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >อนุมัติ</button>
        </div>
      )}
    </form>
  );
}