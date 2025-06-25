"use client";

import React, { ChangeEvent } from "react";
import Swal from "sweetalert2";

export interface User {
  id: string;
  name: string;
  position: string;
  role: "USER" | "MANAGER" | "INSURANCE";
}

export interface CPMFormValues {
  accidentDate: string;
  accidentTime: string;
  location: string;
  cause: string;
  repairShop: string;
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

export type CPMSubmitHandler = (header: { categoryMain: string; categorySub: string; approverId: string },
 values: CPMFormValues,
 files: { damageFiles: File[]; estimateFiles: File[]; otherFiles: File[] },
 saveAsDraft: boolean
) => void

interface CPMFormProps {
  header: { categoryMain: string; categorySub: string; approverId: string };
  onHeaderChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  values: CPMFormValues;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFileChange: (
    e: ChangeEvent<HTMLInputElement>,
    field: "damageFiles" | "estimateFiles" | "otherFiles"
  ) => void;
  onFileRemove: (
    field: "damageFiles" | "estimateFiles" | "otherFiles",
    index: number
  ) => void;               // ← เพิ่มตรงนี้
  onSubmit: CPMSubmitHandler;
  approverList: User[];
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
  onHeaderChange,
  values,
  onChange,
  onFileChange,
  onFileRemove,
  onSubmit,
  approverList,
  submitting,
  readOnly = false,
  isEvidenceFlow = false,
  error,
  files,
}: CPMFormProps) {
  const requiredFields = [
    { key: "approverId", label: "ผู้อนุมัติเอกสาร" },
    { key: "accidentDate", label: "วันที่เกิดเหตุ" },
    { key: "accidentTime", label: "เวลา" },
    { key: "location", label: "สถานที่เกิดเหตุ" },
    { key: "cause", label: "สาเหตุของอุบัติเหตุ" },
    { key: "damageDetail", label: "รายละเอียดความเสียหาย" },
    { key: "damageAmount", label: "มูลค่าความเสียหาย" },
  ];

  const handleClick = (saveAsDraft: boolean) => {
    if (!saveAsDraft) {
      const missing: string[] = [];
      requiredFields.forEach(({ key, label }) => {
        const v = key === "approverId" ? header.approverId : (values as any)[key];
        if (!v || v.trim() === "") missing.push(label);
      });
      if (!isEvidenceFlow) {
        if (files.damageFiles.length === 0) missing.push("รูปภาพความเสียหาย");
        if (files.estimateFiles.length === 0) missing.push("เอกสารสำรวจความเสียหาย");
      }
      if (missing.length) {
        Swal.fire({
          icon: "warning",
          title: "กรุณาใส่ข้อมูลให้ครบถ้วน",
          html: missing.map(m => `&bull; ${m}`).join("<br/>"),
        });
        return;
      }
    }
    onSubmit(header, values, files, saveAsDraft);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-8">
        {readOnly ? "View Claim" : "New Claim"}
      </h1>

      {error && (
        <p className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded">
          {error}
        </p>
      )}

      <form className="space-y-6">
        {/* --- Header --- */}
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="block mb-1">หมวดหลัก</label>
            <input
              type="text"
              readOnly
              value={header.categoryMain||""}
              className="w-full border px-3 py-2 rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block mb-1">หมวดย่อย</label>
            <input
              type="text"
              readOnly
              value={header.categorySub||""}
              className="w-full border px-3 py-2 rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block mb-1">
              ผู้อนุมัติเอกสาร <span className="text-red-600">*</span>
            </label>
            <select
              name="approverId"
              value={header.approverId||""}
              onChange={onHeaderChange}
              disabled={readOnly}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">-- โปรดเลือก --</option>
              {approverList.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.position}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. Accident details */}
        <fieldset className="border-t pt-4">
          <legend className="font-medium">1. ลักษณะอุบัติเหตุ</legend>
          <div className="grid grid-cols-2 gap-4 mt-3">
            {/* date */}
            <div>
              <label>
                วันที่เกิดเหตุ <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="accidentDate"
                value={values.accidentDate||""}
                onChange={onChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                disabled={readOnly}
              />
            </div>
            {/* time */}
            <div>
              <label>
                เวลา <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                name="accidentTime"
                value={values.accidentTime||""}
                onChange={onChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                disabled={readOnly}
              />
            </div>
            {/* location */}
            <div className="col-span-2">
              <label>
                ที่อยู่สถานที่เกิดเหตุ <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={values.location||""}
                onChange={onChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                disabled={readOnly}
              />
            </div>
            {/* cause */}
            <div className="col-span-2">
              <label>
                สาเหตุของอุบัติเหตุ <span className="text-red-600">*</span>
              </label>
              <textarea
                name="cause"
                value={values.cause||""}
                onChange={onChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                disabled={readOnly}
              />
            </div>
          </div>
        </fieldset>

        {/* 2. Police */}
        <fieldset className="border-t pt-4">
          <legend className="font-medium">
            2. การแจ้งความต่อเจ้าหน้าที่ตำรวจ (ถ้ามี)
          </legend>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label>วันที่แจ้ง <span className="text-gray-500">(ถ้ามี)</span></label>
              <input
                type="date"
                name="policeDate"
                value={values.policeDate||""}
                onChange={onChange}
                disabled={readOnly}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label>เวลา</label>
              <input
                type="time"
                name="policeTime"
                value={values.policeTime||""}
                onChange={onChange}
                disabled={readOnly}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
            <div className="col-span-2">
              <label>สถานีตำรวจ</label>
              <input
                type="text"
                name="policeStation"
                value={values.policeStation||""}
                onChange={onChange}
                disabled={readOnly}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </fieldset>

        {/* 3. Damage */}
        <fieldset className="border-t pt-4 space-y-4">
          <legend className="font-medium">
            3. ความเสียหายของทรัพย์สิน <span className="text-red-600">*</span>
          </legend>
          <div className="flex items-center space-x-6">
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
              value={values.damageOtherOwn||""}
              onChange={onChange}
              disabled={readOnly}
              placeholder="ระบุทรัพย์สิน"
              className="border border-gray-300 px-4 py-2 rounded-lg flex-1 bg-white shadow-sm focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label>รายละเอียดความเสียหาย</label>
              <textarea
                name="damageDetail"
                value={values.damageDetail||""}
                onChange={onChange}
                disabled={readOnly}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label>มูลค่าโดยประมาณ</label>
              <input
                type="number"
                name="damageAmount"
                value={values.damageAmount||""}
                onChange={onChange}
                disabled={readOnly}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label>รายละเอียดผู้เสียชีวิต/ผู้บาดเจ็บ (หากมี)</label>
              <textarea
                name="victimDetail"
                value={values.victimDetail||""}
                onChange={onChange}
                disabled={readOnly}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
            <div className="col-span-2">
  <label>ร้านที่ไปซ่อม</label>
  <input
    type="text"
    name="repairShop"
    value={values.repairShop||""}
    onChange={onChange}
    disabled={readOnly}
    className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
  />
</div>
          </div>
        </fieldset>

        {/* 4. Other party */}
        <fieldset className="border-t pt-6 space-y-4">
          <legend className="font-medium">
            4. ความเสียหายของทรัพย์สินคู่กรณี (หากมี)
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>ชื่อ-นามสกุล (หรือชื่อบริษัท)</label>
              <input
                type="text"
                name="partnerName"
                value={values.partnerName||""}
                onChange={onChange}
                disabled={readOnly}
               className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label>เบอร์โทรศัพท์</label>
              <input
                type="text"
                name="partnerPhone"
                value={values.partnerPhone||""}
                onChange={onChange}
                disabled={readOnly}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
            <div className="col-span-2">
              <label>ที่อยู่สถานที่เกิดเหตุ</label>
              <input
                type="text"
                name="partnerLocation"
                value={values.partnerLocation||""}
                onChange={onChange}
                disabled={readOnly}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
            <div className="col-span-2">
              <label>รายละเอียดความเสียหายของทรัพย์สิน</label>
              <textarea
                name="partnerDamageDetail"
                value={values.partnerDamageDetail||""}
                onChange={onChange}
                disabled={readOnly}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label>มูลค่าโดยประมาณ</label>
              <input
                type="number"
                name="partnerDamageAmount"
                value={values.partnerDamageAmount||""}
                onChange={onChange}
                disabled={readOnly}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label>รายละเอียดผู้เสียชีวิต/ผู้บาดเจ็บ (หากมี)</label>
              <textarea
                name="partnerVictimDetail"
                value={values.partnerVictimDetail||""}
                onChange={onChange}
                disabled={readOnly}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm bg-white focus:ring-blue-400 focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </fieldset>

        {/* Attachments */}
        {!readOnly && (
         <fieldset className="border-t pt-6 space-y-6">
      <legend className="font-semibold text-lg">แนบเอกสารตามรายการ</legend>

      {( ["damageFiles", "estimateFiles", "otherFiles"] as const ).map(
        (field, idx) => {
          const label =
            field === "damageFiles"
              ? "1) รูปภาพความเสียหาย"
              : field === "estimateFiles"
              ? "2) เอกสารสำรวจความเสียหาย"
              : "3) เอกสารเพิ่มเติมอื่น ๆ";

          return (
            <div key={field}>
              <label className="block mb-2 font-medium">
                {label} {idx < 2 && <span className="text-red-600">*</span>}
              </label>

              {/* Dropzone-like */}
              <label
                htmlFor={field}
                className="group flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 bg-white p-6 rounded-xl shadow-sm cursor-pointer transition-all"
              >
                <svg
                  className="w-8 h-8 text-gray-400 group-hover:text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4v16m8-8H4" strokeWidth={2} />
                </svg>
                <span className="mt-2 text-gray-600 group-hover:text-blue-600 text-sm">
                  คลิกหรือวางไฟล์ที่นี่
                </span>
                <input
                  id={field}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                  onChange={e => onFileChange(e, field)}
                  className="hidden"
                />
              </label>

              {/* List ไฟล์ที่เลือก พร้อมปุ่มลบ */}
              {files[field].length > 0 && (
  <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
    {files[field].map((f, i) => {
      const isImage = f.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(f) : null;
      return (
        <li key={`${field}-${i}`} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
          {isImage ? (
            <img src={previewUrl!}
                 alt={f.name}
                 className="w-12 h-12 object-cover rounded" />
          ) : (
            <span className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-600 rounded">
              📄
            </span>
          )}
          <div className="flex-1 truncate">
            <p className="text-sm font-medium">{f.name}</p>
            <p className="text-xs text-gray-500">{(f.size/1024).toFixed(1)} KB</p>
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
    </fieldset>
        )}

        {/* Buttons */}
        {!readOnly && (
          
          <div className="flex space-x-4 pt-4">
            {(!isEvidenceFlow&&
            <button
              type="button"
              onClick={() => handleClick(true)}
              disabled={submitting}
              className="bg-gray-600 text-white px-4 py-2 rounded"
            >
              Save Draft
            </button>
            )}
            <button
              type="button"
              onClick={() => handleClick(false)}
              disabled={
                submitting
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow transition"
            >
              Submit
            </button>
          </div>
        )}
        

        
      </form>
      
    </div>
  );
}