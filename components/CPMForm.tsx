"use client";

import React, { ChangeEvent, ChangeEventHandler } from "react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import ThaiDatePicker from "@/components/ThaiDatePicker";
export interface User {
  id: string;
  employeeName: { th?: string; en?: string };
  position: string;
  email: string;
  department: string; // Optional, in case some users don't have a department
  role: "USER" | "MANAGER" | "INSURANCE";
}

export interface CPMFormValues {
  phoneNum: string;
  accidentDate: string;
  accidentTime: string;
  location: string;
  cause: string;
  repairShop: string;
  repairShopLocation: string;
  policeDate: string;
  policeTime: string;
  policeStation: string;
  damageOwnType: "mitrphol" | "other";
  damageOtherOwn: string;
  damageDetail: string;
  damageAmount: string;
  victimDetail: string;
  partnerName: string;
  partnerPhone: string;
  partnerLocation: string;
  partnerDamageDetail: string;
  partnerDamageAmount: string;
  partnerVictimDetail: string;
}

export type CPMSubmitHandler = (
  header: { categoryMain: string; categorySub: string; approverEmail: string },
  values: CPMFormValues,
  files: { damageFiles: File[]; estimateFiles: File[]; otherFiles: File[] },
  saveAsDraft: boolean
) => void;
export interface AttachmentItem {
  id: string;
  fileName: string;
  url: string;
  type: "DAMAGE_IMAGE" | "ESTIMATE_DOC" | "OTHER_DOCUMENT";
}
interface CPMFormProps {
  header: {
    signerEditable?: boolean;
    approverKeyword: string;
    categoryMain: string;
    categorySub: string;
    approverEmail: string;
    approverId: string;
    approverName: string;
    approverDepartment: string;
    approverPosition: string;
    signerEmail: string;
    signerId: string;
    signerName: string;
    signerPosition: string;
    signerKeyword: string;
  };
  existingFiles?: AttachmentItem[];
  onDeleteExisting?: (att: AttachmentItem) => void;
  onSelectApprover: (u: User) => void;
  onSelectSigner: (u: User) => void;
  onHeaderChange: ChangeEventHandler<HTMLInputElement>;
  onSignerChange: ChangeEventHandler<HTMLInputElement>;
  values: CPMFormValues;
  approverList: User[];
  signerList: User[];
  onSaveSigner?: () => void;
  signerEditable?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFileChange: (
    e: ChangeEvent<HTMLInputElement>,
    field: "damageFiles" | "estimateFiles" | "otherFiles"
  ) => void;
  onFileRemove: (
    field: "damageFiles" | "estimateFiles" | "otherFiles",
    index: number
  ) => void; // ← เพิ่มตรงนี้
  onSubmit: CPMSubmitHandler;
  submitting: boolean;
  readOnly?: boolean;
  isEvidenceFlow?: boolean;
  error: string | null;
  files: {
    damageFiles: File[];
    estimateFiles: File[];
    otherFiles: File[];
  };
}

export default function CPMForm({
  header,
  onSaveSigner,
  onHeaderChange,
  onSelectApprover,
  onSelectSigner,
  approverList,
  values,
  existingFiles = [],
  onDeleteExisting,
  onChange,
  signerList,
  onSignerChange,
  onFileChange,
  onFileRemove,
  onSubmit,
  signerEditable,
  submitting,
  readOnly = false,
  isEvidenceFlow = false,
  error,
  files,
}: CPMFormProps) {
  const requiredFields = [
    { key: "approverEmail", label: "ผู้อนุมัติเอกสาร" },
    { key: "phoneNum", label: "เบอร์โทรติดต่อ" },
    { key: "accidentDate", label: "วันที่เกิดเหตุ" },
    { key: "accidentTime", label: "เวลา" },
    { key: "location", label: "สถานที่เกิดเหตุ" },
    { key: "cause", label: "สาเหตุของอุบัติเหตุ" },
    { key: "damageDetail", label: "รายละเอียดความเสียหาย" },
    { key: "damageAmount", label: "มูลค่าความเสียหาย" },
  ];
  const allDamage   = [ ...existingFiles.filter(a=>a.type==='DAMAGE_IMAGE'),  ...files.damageFiles ];
  const allEstimate = [ ...existingFiles.filter(a=>a.type==='ESTIMATE_DOC'),    ...files.estimateFiles ];
  const allOther    = [ ...existingFiles.filter(a=>a.type==='OTHER_DOCUMENT'), ...files.otherFiles ];

  const handleClick = (saveAsDraft: boolean) => {
    if (!saveAsDraft) {
      const missing: string[] = [];
      requiredFields.forEach(({ key, label }) => {
        const v =
          key === "approverEmail" ? header.approverEmail : (values as any)[key];
        if (!v || v.trim() === "") missing.push(label);
      });

     if (!isEvidenceFlow) {
      // count both old + new
      const existingDamage = existingFiles.filter(f => f.type === 'DAMAGE_IMAGE').length;
      const existingEstimate = existingFiles.filter(f => f.type === 'ESTIMATE_DOC').length;

      if (existingDamage + files.damageFiles.length === 0) {
        missing.push("รูปภาพความเสียหาย");
      }
      if (existingEstimate + files.estimateFiles.length === 0) {
        missing.push("เอกสารสำรวจความเสียหาย");
      }
    }
      if (missing.length) {
        Swal.fire({
          icon: "warning",
          title: "กรุณาใส่ข้อมูลให้ครบถ้วน",
          html: missing.map((m) => `&bull; ${m}`).join("<br/>"),
        });
        return;
      }
    }
    onSubmit(header, values, files, saveAsDraft);
  };

  const inputClass = (readOnly: boolean) =>
    `w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm 
   focus:ring-2 focus:ring-blue-400 transition
   ${readOnly ? "bg-gray-100 text-gray-600" : "bg-white text-gray-800"}`;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-10 px-4"
    >
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          {readOnly
            ? "ดูแบบฟอร์มแจ้งอุบัติเหตุ"
            : "สร้างแบบฟอร์มแจ้งอุบัติเหตุ"}
        </h1>

        {error && (
          <div className="mb-6 flex items-center bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <span className="text-lg mr-2">⚠️</span>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form className="space-y-8">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                หมวดหลัก
              </label>
              <input
                type="text"
                readOnly
                value={header.categoryMain}
                className="w-full bg-gray-100 border border-gray-200 px-4 py-2 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                หมวดย่อย
              </label>
              <input
                type="text"
                readOnly
                value={header.categorySub}
                className="w-full bg-gray-100 border border-gray-200 px-4 py-2 rounded-lg focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="relative mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                ผู้รายงาน (EMAIL) <span className="text-red-500">*</span>
              </label>
              <input
                name="approverKeyword"
                type="text"
                value={header.approverKeyword}
                onChange={onHeaderChange}
                placeholder="พิมพ์ชื่อหรืออีเมล"
                autoComplete="off"
                className={inputClass(readOnly)}
                disabled={readOnly}
              />

              {/* dropdown */}
              {/* Approver dropdown */}
              {!readOnly && approverList.length > 0 && (
                <ul
                  className="
    absolute top-full left-0 right-0 mt-1
    bg-white border border-gray-300 rounded shadow-lg z-50
    max-h-48 overflow-y-auto
  "
                >
                  {approverList.map((u) => (
                    <li
                      key={u.id}
                      onClick={() => onSelectApprover(u)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {u.employeeName.th || u.employeeName.en} ({u.email})
                    </li>
                  ))}
                </ul>
              )}
              {header.approverName && (
                <p className="mt-1 text-sm text-gray-500">
                  Selected: {header.approverName} ({header.approverPosition})
                </p>
              )}
            </div>

            {/* Signer (เอาทุกอย่างไว้ใน div เดียว) */}
            <div className="relative mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                ผู้เซ็นอนุมัติเอกสาร (EMAIL){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                name="signerKeyword"
                type="text"
                value={header.signerKeyword}
                onChange={onSignerChange}
                placeholder="พิมพ์ชื่อหรืออีเมล"
                autoComplete="off"
                className={inputClass(readOnly && !signerEditable)}
                disabled={readOnly && !signerEditable}
              />

              {!readOnly && signerList.length > 0 && (
                <ul
                  className="
    absolute top-full left-0 right-0 mt-1
    bg-white border border-gray-300 rounded shadow-lg z-50
    max-h-48 overflow-y-auto
  "
                >
                  {signerList.map((u: User) => (
                    <li
                      key={u.id}
                      onClick={() => onSelectSigner(u)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {u.employeeName.th || u.employeeName.en} ({u.email})
                    </li>
                  ))}
                </ul>
              )}
              {header.signerName && (
                <p className="mt-1 text-sm text-gray-500">
                  Selected: {header.signerName} ({header.signerPosition})
                </p>
              )}

              {signerEditable && onSaveSigner && (
                <button
                  type="button"
                  onClick={onSaveSigner}
                  className="ml-2 mt-1 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
                >
                  Save signer
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                หมายเลขติดต่อ <span className="text-red-500">*</span>
              </label>
              <input
                name="phoneNum"
                value={values.phoneNum || ""}
                onChange={onChange}
                disabled={readOnly}
                className={inputClass(readOnly)}
              />
            </div>
          </div>
          {/* 1. Accident Details */}
          <section className="bg-blue-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              1. ลักษณะอุบัติเหตุ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ThaiDatePicker
                  name="accidentDate"
                  label="วันที่เกิดเหตุ"
                  value={values.accidentDate}
                  onChange={(iso) =>
                    // wrap into a fake ChangeEvent so your existing onChange handler still works
                    onChange({
                      target: { name: "accidentDate", value: iso },
                    } as any)
                  }
                  disabled={readOnly}
                  inputClass={inputClass(readOnly)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  เวลา <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="accidentTime"
                  value={values.accidentTime || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  className={inputClass(readOnly)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">
                  ที่อยู่สถานที่เกิดเหตุ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={values.location || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  className={inputClass(readOnly)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">
                  สาเหตุของอุบัติเหตุ(ไม่เกิน 250 ตัวอักษร){" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="cause"
                  value={values.cause || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  className={inputClass(readOnly)}
                />
              </div>
            </div>
          </section>

          {/* 2. Police Report */}
          <section className="bg-blue-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              2. การแจ้งความต่อเจ้าหน้าที่ตำรวจ (ถ้ามี)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ThaiDatePicker
                  name="policeDate"
                  label="วันที่แจ้ง"
                  value={values.policeDate}
                  onChange={(iso) =>
                    onChange({
                      target: { name: "policeDate", value: iso },
                    } as any)
                  }
                  disabled={readOnly}
                  inputClass={inputClass(readOnly)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">เวลา</label>
                <input
                  type="time"
                  name="policeTime"
                  value={values.policeTime || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  className={inputClass(readOnly)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">
                  สถานีตำรวจ
                </label>
                <input
                  type="text"
                  name="policeStation"
                  value={values.policeStation || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  className={inputClass(readOnly)}
                />
              </div>
            </div>
          </section>

          {/* 3. Damage Details */}
          <section className="bg-blue-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              3. ความเสียหายของทรัพย์สิน <span className="text-red-500">*</span>
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:space-x-6 items-start">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="damageOwnType"
                    value="mitrphol"
                    checked={values.damageOwnType === "mitrphol"}
                    onChange={onChange}
                    disabled={readOnly}
                    className="mr-2"
                  />
                  ทรัพย์สินของกลุ่มมิตรผล
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="damageOwnType"
                    value="other"
                    checked={values.damageOwnType === "other"}
                    onChange={onChange}
                    disabled={readOnly}
                    className="mr-2"
                  />
                  ทรัพย์สินของ
                </label>
                <input
                  type="text"
                  name="damageOtherOwn"
                  value={values.damageOtherOwn || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  placeholder="ระบุทรัพย์สิน"
                  className="mt-2 md:mt-0 border border-gray-300 px-4 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 flex-1 transition"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    รายละเอียดความเสียหาย
                  </label>
                  <textarea
                    name="damageDetail"
                    value={values.damageDetail || ""}
                    onChange={onChange}
                    disabled={readOnly}
                    className={inputClass(readOnly)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    มูลค่าโดยประมาณ
                  </label>
                  <input
                    type="number"
                    name="damageAmount"
                    value={values.damageAmount || ""}
                    onChange={onChange}
                    disabled={readOnly}
                    className={inputClass(readOnly)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    รายละเอียดผู้เสียชีวิต/ผู้บาดเจ็บ (หากมี)
                  </label>
                  <textarea
                    name="victimDetail"
                    value={values.victimDetail || ""}
                    onChange={onChange}
                    disabled={readOnly}
                    className={inputClass(readOnly)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    ร้านที่ไปซ่อม
                  </label>
                  <input
                    type="text"
                    name="repairShop"
                    value={values.repairShop || ""}
                    onChange={onChange}
                    disabled={readOnly}
                    className={inputClass(readOnly)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    ที่ตั้งร้านซ่อม
                  </label>
                  <input
                    type="text"
                    name="repairShopLocation"
                    value={values.repairShopLocation || ""}
                    onChange={onChange}
                    disabled={readOnly}
                    className={inputClass(readOnly)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 4. Other Party Damage */}
          <section className="bg-blue-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              4. ความเสียหายของทรัพย์สินคู่กรณี (หากมี)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  ชื่อ-นามสกุล (หรือชื่อบริษัท)
                </label>
                <input
                  type="text"
                  name="partnerName"
                  value={values.partnerName || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  className={inputClass(readOnly)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="text"
                  name="partnerPhone"
                  value={values.partnerPhone || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  className={inputClass(readOnly)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">
                  ที่อยู่สถานที่เกิดเหตุ
                </label>
                <input
                  type="text"
                  name="partnerLocation"
                  value={values.partnerLocation || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  className={inputClass(readOnly)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">
                  รายละเอียดความเสียหายของทรัพย์สิน
                </label>
                <textarea
                  name="partnerDamageDetail"
                  value={values.partnerDamageDetail || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  className={inputClass(readOnly)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  มูลค่าโดยประมาณ
                </label>
                <input
                  type="number"
                  name="partnerDamageAmount"
                  value={values.partnerDamageAmount || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  className={inputClass(readOnly)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  รายละเอียดผู้เสียชีวิต/ผู้บาดเจ็บ (หากมี)
                </label>
                <textarea
                  name="partnerVictimDetail"
                  value={values.partnerVictimDetail || ""}
                  onChange={onChange}
                  disabled={readOnly}
                  className={inputClass(readOnly)}
                />
              </div>
            </div>
          </section>

          {!readOnly && (
  <section className="bg-blue-50 border border-gray-200 rounded-lg p-6 space-y-6">
    <h2 className="text-lg font-semibold text-gray-700 mb-4">
      แนบเอกสารตามรายการ
    </h2>

    {(["damageFiles", "estimateFiles", "otherFiles"] as const).map((field, idx) => {
      const label = field === "damageFiles"
        ? "1) รูปภาพความเสียหาย"
        : field === "estimateFiles"
          ? "2) เอกสารสำรวจความเสียหาย"
          : "3) เอกสารเพิ่มเติมอื่น ๆ";

      // แยก existing กับ ใหม่
     const typeMap: Record<
  'damageFiles' | 'estimateFiles' | 'otherFiles',
  AttachmentItem['type']
> = {
  damageFiles:   'DAMAGE_IMAGE',
  estimateFiles: 'ESTIMATE_DOC',
  otherFiles:    'OTHER_DOCUMENT',
};

// … then inside your .map((field, idx) => { …
const attachmentType = typeMap[field];
const exist          = existingFiles.filter(f => f.type === attachmentType);
const added          = files[field];

      return (
        <div key={field}>
          <label className="block mb-2 font-medium text-gray-700">
            {label} {idx < 2 && <span className="text-red-500">*</span>}
          </label>

          {/* แสดงไฟล์เดิม */}
          {exist.length > 0 && (
            <ul className="mb-2">
              {exist.map(f => (
                <li key={f.id} className="flex items-center space-x-2 text-sm text-gray-700">
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="underline">
                    {f.fileName}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* input ใหม่ */}
          <label
            htmlFor={field}
            className="group flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 bg-white p-6 rounded-xl shadow-sm cursor-pointer transition-all"
          >
            <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500" /* … */ />
            <span className="mt-2 text-gray-600 group-hover:text-blue-600 text-sm">
              คลิกหรือวางไฟล์ที่นี่
            </span>
            <input
              id={field}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.xlsx"
              multiple
              onChange={(e) => onFileChange(e, field)}
              className="hidden"
            />
          </label>

                      {files[field].length > 0 && (
                        <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {files[field].map((f, i) => {
                            const isImage = f.type.startsWith("image/");
                            const previewUrl = isImage
                              ? URL.createObjectURL(f)
                              : null;
                            return (
                              <li
                                key={`${field}-${i}`}
                                className="flex items-center space-x-2 bg-gray-50 p-2 rounded"
                              >
                                {isImage ? (
                                  <img
                                    src={previewUrl!}
                                    alt={f.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                ) : (
                                  <span className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-600 rounded">
                                    📄
                                  </span>
                                )}
                                <div className="flex-1 truncate">
                                  <p className="text-sm font-medium">
                                    {f.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {(f.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onFileRemove(field, i)}
                                  className="text-gray-500 hover:text-red-600"
                                  aria-label="Remove file"
                                >
                                  ✕
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                }
              )}
            </section>
          )}

          {/* Buttons */}
          {!readOnly && (
            <div className="flex space-x-4 pt-4">
              {!isEvidenceFlow && (
                <button
                  type="button"
                  onClick={() => handleClick(true)}
                  disabled={submitting}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg transition hover:bg-gray-700"
                >
                  Save Draft
                </button>
              )}
              <button
                type="button"
                onClick={() => handleClick(false)}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-lg transition"
              >
                Submit
              </button>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
}
