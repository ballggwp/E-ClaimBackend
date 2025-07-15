// components/FPPA04CPMForm.tsx
"use client";

import { useParams } from "next/navigation";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import ThaiDatePicker from "@/components/ThaiDatePicker";

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
  signatureUrls?: string[];
  insurancePayout: string;
}

interface Props {
  defaults: {
    signerName: string | number | readonly string[] | undefined;
    docNum: string;
    accidentDate?: string;
    status: string;
    cause: string;
    approverName: string;
  };
  initialData?: FPPA04CPMFormValues;
  onChange?: (vals: FPPA04CPMFormValues) => void;
  onSave: (vals: FPPA04CPMFormValues) => void | Promise<void>;
}

export default function FPPA04Form({
  defaults,
  initialData,
  onChange,
  onSave,
}: Props) {
  const { claimId } = useParams();
  const defaultAdjustments: FPPA04CPMAdjustment[] = [
    { type: "หัก", description: "ส่วนลดจากตัวแทนจำหน่าย", amount: "0.00" },
    { type: "หัก", description: "รายได้จากการขายเศษซาก", amount: "0.00" },
    {
      type: "หัก",
      description: "กำหนดวงเงินเอาประกันภัยต่ำกว่ามูลค่าที่แท้จริง",
      amount: "0.00",
    },
    {
      type: "บวก",
      description: "รายการที่เจรจาต่อได้เพิ่มขึ้น",
      amount: "0.00",
    },
    { type: "หัก", description: "รายการที่ปรับลดลง", amount: "0.00" },
    {
      type: "หัก",
      description: "ความรับผิดชอบส่วนแรก 10% หรือขั้นต่ำ 20,000 (พลิกคว่ำ)",
      amount: "0.00",
    },
  ];
  const defaultItems: FPPA04CPMFormItem[] = [
    {
      category: "1.1 รายการซ่อมแซม",
      description: "",
      total: "0.00",
      exception: "0.00",
    },
    {
      category: "1.2 รายการเปลี่ยนใหม่",
      description: "",
      total: "0.00",
      exception: "0.00",
    },
    {
      category: "1.3 รายการอื่นๆ (ไม่อยู่ในเงื่อนไขการเคลม)",
      description: "",
      total: "0.00",
      exception: "0.00",
    },
    {
      category: "1.4 ค่าบริการ",
      description: "",
      total: "0.00",
      exception: "0.00",
    },
  ];
  const canEdit = defaults.status === "PENDING_INSURER_FORM";
  const { data: session } = useSession();

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const existingUrls = initialData?.signatureUrls || [];
  // initialize state
  const [vals, setVals] = useState<FPPA04CPMFormValues>(() => ({
    eventType: initialData?.eventType || "",
    claimRefNumber: initialData?.claimRefNumber || "",
    eventDescription: initialData?.eventDescription || "",
    productionYear:
      initialData?.productionYear || new Date().getFullYear().toString(),
    accidentDate: initialData?.accidentDate || "",
    reportedDate: initialData?.reportedDate || "",
    receivedDocDate: initialData?.receivedDocDate || "",
    company: initialData?.company || "",
    factory: initialData?.factory || "",
    policyNumber: initialData?.policyNumber || "",
    surveyorRefNumber: initialData?.surveyorRefNumber || "",
    items: initialData?.items.length ? initialData.items : defaultItems,
    adjustments: initialData?.adjustments?.length
      ? initialData.adjustments
      : defaultAdjustments,
    signatureFiles: [],
    insurancePayout: initialData?.insurancePayout || "",
  }));
  useEffect(() => {
    if (onChange) onChange(vals);
  }, [vals, onChange]);

  const updateField = <K extends keyof FPPA04CPMFormValues>(
    key: K,
    value: FPPA04CPMFormValues[K]
  ) => {
    setVals((v) => ({ ...v, [key]: value }));
  };

  const handleInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!canEdit) return;
    const { name, value } = e.target;
    updateField(name as any, value as any);
  };

  // handlers preventing edit when not allowed
  const handleField = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!canEdit) return;
    const { name, value } = e.target;
    setVals((v) => ({ ...v, [name]: value }));
  };

  const changeItem = (i: number, k: keyof FPPA04CPMFormItem, v: string) => {
    if (!canEdit) return;
    setVals((vs) => {
      const items = [...vs.items];
      items[i] = { ...items[i], [k]: v };
      return { ...vs, items };
    });
  };
  const addItem = () =>
    canEdit &&
    setVals((vs) => ({
      ...vs,
      items: [
        ...vs.items,
        { category: "", description: "", total: "", exception: "" },
      ],
    }));
  const delItem = (i: number) =>
    canEdit &&
    setVals((vs) => ({ ...vs, items: vs.items.filter((_, idx) => idx !== i) }));

  const changeAdj = (i: number, k: keyof FPPA04CPMAdjustment, v: string) => {
    if (!canEdit) return;
    setVals((vs) => {
      const a = [...vs.adjustments];
      a[i] = { ...a[i], [k]: v };
      return { ...vs, adjustments: a };
    });
  };
  const addAdj = () =>
    canEdit &&
    setVals((vs) => ({
      ...vs,
      adjustments: [
        ...vs.adjustments,
        { type: "บวก", description: "", amount: "" },
      ],
    }));
  const delAdj = (i: number) =>
    canEdit &&
    setVals((vs) => ({
      ...vs,
      adjustments: vs.adjustments.filter((_, idx) => idx !== i),
    }));

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const files = Array.from(e.target.files || []);
    setNewFiles((f) => [...f, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setNewPreviews((p) => [...p, ...urls]);
    // เก็บ files ไว้ใน vals ด้วย (ส่งขึ้น API)
    setVals((v) => ({ ...v, signatureFiles: [...v.signatureFiles, ...files] }));
  };

  useEffect(() => {
    return () => newPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [newPreviews]);
  const removeNew = (i: number) => {
    URL.revokeObjectURL(newPreviews[i]);
    setNewPreviews((p) => p.filter((_, idx) => idx !== i));
    setNewFiles((f) => f.filter((_, idx) => idx !== i));
    setVals((v) => ({
      ...v,
      signatureFiles: v.signatureFiles.filter((_, idx) => idx !== i),
    }));
  };

  // calculate sums
  const totalSum = vals.items.reduce(
    (s, i) => s + parseFloat(i.total || "0"),
    0
  );
  const exceptionSum = vals.items.reduce(
    (s, i) => s + parseFloat(i.exception || "0"),
    0
  );
  const coverageSum = totalSum - exceptionSum;
  const plusSum = vals.adjustments
    .filter((a) => a.type === "บวก")
    .reduce((s, a) => s + parseFloat(a.amount || "0"), 0);
  const minusSum = vals.adjustments
    .filter((a) => a.type === "หัก")
    .reduce((s, a) => s + parseFloat(a.amount || "0"), 0);
  const finalNet = coverageSum + plusSum - minusSum;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "ยืนยันจะส่งข้อมูลแบบฟอร์มหรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ส่งเลย",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    const fd = new FormData();
    (
      [
        "eventType",
        "claimRefNumber",
        "eventDescription",
        "productionYear",
        "accidentDate",
        "reportedDate",
        "receivedDocDate",
        "company",
        "factory",
        "policyNumber",
        "surveyorRefNumber",
      ] as const
    ).forEach((k) => fd.append(k, vals[k]));
    vals.items.forEach((i) => fd.append("items", JSON.stringify(i)));
    vals.adjustments.forEach((a) =>
      fd.append("adjustments", JSON.stringify(a))
    );
    vals.signatureFiles.forEach((file) => {
      fd.append("signatureFiles", file);
    });
    fd.append("insurancePayout", vals.insurancePayout);
    fd.append("netAmount", finalNet.toFixed(2));

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fppa04/${claimId}/cpm`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.user.accessToken}` },
        body: fd,
      }
    );
    if (!res.ok) return Swal.fire("Error", await res.text(), "error");
    await onSave(vals);
  };

  const inputClass = (editable: boolean) =>
    `w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm focus:outline-none transition ${
      editable ? "bg-white" : "bg-gray-100 text-gray-600 cursor-not-allowed"
    }`;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-1 font-medium">เลขที่ฟอร์ม</label>
          <input
            readOnly
            value={defaults.docNum}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-50"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">สาเหตุของอุบัติเหตุ</label>
          <textarea
            readOnly
            value={defaults.cause}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-50"
          />
        </div>
      </div>

      {/* Policy & Claim Ref */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-1 font-medium">ประเภทกรมธรรม์</label>
          <input
            name="eventType"
            value={vals.eventType}
            onChange={handleInput}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">หมายเลขรับ Claim</label>
          <input
            name="claimRefNumber"
            value={vals.claimRefNumber}
            onChange={handleInput}
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
          onChange={handleInput}
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
            onChange={handleInput}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
        <div>
          <ThaiDatePicker
            name="accidentDate"
            label="วันที่เกิดเหตุ"
            value={vals.accidentDate}
            onChange={(iso) => setVals((v) => ({ ...v, accidentDate: iso }))}
            disabled={!canEdit}
            inputClass={inputClass(canEdit)}
          />
        </div>
      </div>

      {/* Second row: reportedDate + receivedDocDate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div>
          <ThaiDatePicker
            name="reportedDate"
            label="วันที่รับแจ้ง"
            value={vals.reportedDate}
            onChange={(iso) => setVals((v) => ({ ...v, reportedDate: iso }))}
            disabled={!canEdit}
            inputClass={inputClass(canEdit)}
          />
        </div>
        <div>
          <ThaiDatePicker
            name="receivedDocDate"
            label="วันที่ได้รับเอกสาร"
            value={vals.receivedDocDate}
            onChange={(iso) => setVals((v) => ({ ...v, receivedDocDate: iso }))}
            disabled={!canEdit}
            inputClass={inputClass(canEdit)}
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
            onChange={handleInput}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">โรงงาน</label>
          <input
            name="factory"
            value={vals.factory}
            onChange={handleInput}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">ผู้อนุมัติเอกสาร</label>
          <input
            readOnly
            value={defaults.signerName}
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
            onChange={handleInput}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">
            เลขที่ Claim Surveyor
          </label>
          <input
            name="surveyorRefNumber"
            value={vals.surveyorRefNumber}
            onChange={handleInput}
            disabled={!canEdit}
            className={inputClass(canEdit)}
          />
        </div>
      </div>

      {/* ตารางรายการแจ้งเคลมประกัน */}
      <div className="overflow-auto">
        <table className=" table-fixed border-collapse ">
          <colgroup>
            <col className="w-1/5" />
            <col className="w-2/5" />
            <col className="w-1/5" />
            <col className="w-1/5" />
            <col className="w-1/5" />
          </colgroup>
          <thead className="bg-blue-50 sticky top-0">
            <tr>
              {["รายการ", "รายละเอียด", "รวม", "ข้อยกเว้น", "คุ้มครอง"].map(
                (h, i) => (
                  <th
                    key={i}
                    className="px-2 py-1 border border-blue-200 text-center text-sm text-blue-800"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {vals.items.map((it, idx) => {
              const cover = (
                parseFloat(it.total || "0") - parseFloat(it.exception || "0")
              ).toFixed(2);
              return (
                <tr key={idx} className="hover:bg-blue-100">
                  {(
                    ["category", "description", "total", "exception"] as const
                  ).map((f, ci) => (
                    <td key={ci} className="px-2 py-1.5 border border-blue-200">
                      <input
                        type={
                          f === "total" || f === "exception" ? "number" : "text"
                        }
                        step="0.01"
                        placeholder={
                          f === "total" || f === "exception"
                            ? "0.00"
                            : undefined
                        }
                        value={(it as any)[f]}
                        onChange={(e) => changeItem(idx, f, e.target.value)}
                        disabled={!canEdit}
                        className="w-full border border-gray-300 px-2 py-1.5 rounded text-xs transition
                             bg-white focus:outline-none focus:ring-2 focus:ring-blue-400
                             disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1 border border-blue-200 text-right text-xs">
                    {cover}
                  </td>
                  {canEdit && (
                    <td
                      className="px-2 py-1 text-center text-red-600 cursor-pointer text-xs"
                      onClick={() => delItem(idx)}
                    >
                      ✖
                    </td>
                  )}
                </tr>
              );
            })}
            <tr className="bg-blue-50 font-semibold text-xs">
              <td
                colSpan={2}
                className="px-2 py-1.5 border border-blue-200 text-right"
              >
                รวม
              </td>
              <td className="px-2 py-1.5 border border-blue-200 text-right">
                {totalSum.toFixed(2)}
              </td>
              <td className="px-2 py-1.5 border border-blue-200 text-right">
                {exceptionSum.toFixed(2)}
              </td>
              <td className="px-2 py-1.5 border border-blue-200 text-right">
                {coverageSum.toFixed(2)}
              </td>
              {canEdit && <td className="bg-white"></td>}
            </tr>
          </tbody>
        </table>
        {canEdit && (
          <button
            type="button"
            onClick={addItem}
            className="mt-2 text-blue-600 hover:underline text-xs"
          >
            + เพิ่มรายการ
          </button>
        )}
      </div>

      <hr className="my-6 border-t border-blue-200" />

      {/* ตารางรายการบวก/หัก */}
      <div className="overflow-auto w-full">
        <table className="table-fixed border-collapse w-full">
          <colgroup>
            <col className="w-1/6" />
            <col className="w-3/6" />
            <col className="w-2/6" />
          </colgroup>
          <thead className="bg-blue-50 sticky top-0">
            <tr>
              {["บวก/หัก", "รายละเอียด", "จำนวนเงิน (บาท)"].map((h, i) => (
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
                    onChange={(e) => changeAdj(idx, "type", e.target.value)}
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
                    onChange={(e) =>
                      changeAdj(idx, "description", e.target.value)
                    }
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
                    onChange={(e) => changeAdj(idx, "amount", e.target.value)}
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
      <div className="flex items-end justify-between mb-6">
        {/* left: insurance payout input */}
        <div className="w-1/2 pr-4">
          <label className="block mb-1 font-medium">
            การพิจารณาจ่ายสินไหมจาก บ.ประกันภัย (บาท)
          </label>
          <input
            name="insurancePayout"
            type="number"
            step="0.01"
            value={vals.insurancePayout}
            onChange={handleInput}
            disabled={!canEdit}
            className={inputClass(canEdit)}
            placeholder="กรอกจำนวนเงิน"
          />
        </div>

        {/* right: net summary */}
        <div className="flex items-baseline space-x-2">
          <span className="font-semibold">เงินรับค่าสินไหมสุทธิ:</span>
          <input
            readOnly
            value={finalNet.toFixed(2)}
            className="w-32 text-right bg-blue-50 border border-blue-200 rounded px-2 py-1.5 font-medium"
          />
          <span>บาท</span>
        </div>
      </div>
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
          {/* 1) รูปเดิมที่มี URL มาโชว์ */}
          {existingUrls.map((url, idx) => {
            const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(url);
            const fileName =
              url.split("/").pop()?.split("?")[0] || `file-${idx + 1}`;

            return (
              <div key={`old-${idx}`} className="p-2 border rounded bg-gray-50">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mb-1"
                >
                  {isImage ? (
                    <img
                      src={url}
                      alt={fileName}
                      className="w-full h-24 object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-24 text-4xl">
                      📄
                    </div>
                  )}
                </a>
                <div className="text-xs text-gray-700 truncate">{fileName}</div>
              </div>
            );
          })}

          {/* 2) รูปใหม่ที่เพิ่งอัปโหลด */}
          {vals.signatureFiles.map((file, idx) => {
            const isImage = file.type.startsWith("image/");
            const sizeKB = (file.size / 1024).toFixed(1);

            // if name already contains a dot, use it; otherwise append the subtype from file.type
            const hasDot = file.name.includes(".");
            const subtype = file.type.split("/")[1] || "";
            const displayName = hasDot ? file.name : `${file.name}.${subtype}`;

            const blobUrl = URL.createObjectURL(file);

            return (
              <div
                key={`new-${idx}`}
                className="relative p-2 border rounded bg-white"
              >
                <a
                  href={blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={!isImage ? displayName : undefined}
                  className="block mb-1"
                >
                  {isImage ? (
                    <img
                      src={blobUrl}
                      alt={displayName}
                      className="w-full h-24 object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-24 text-4xl">
                      📄
                    </div>
                  )}
                </a>
                {/* here we show “name” plus “.subtype” if it was missing */}
                <div className="text-xs text-gray-700 truncate">
                  {displayName}
                </div>
                <div className="text-xs text-gray-500">{sizeKB} KB</div>
                <button
                  type="button"
                  onClick={() => removeNew(idx)}
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
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
          >
            บันทึก FPPA04
          </button>
        </div>
      )}
    </form>
  );
}
