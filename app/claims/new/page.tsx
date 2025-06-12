"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string;
  position: string;
  role: "USER" | "MANAGER" | "INSURANCE";
}
const API = process.env.NEXT_PUBLIC_COMPANY_API_URL;
export default function ClaimCreatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  // ดึงรายชื่อ approver (ผู้เซ็นเอกสาร)
  const [approverList, setApproverList] = useState<User[]>([]);

  // สเตทของฟอร์ม
  const [form, setForm] = useState({
    approverId: "",
    accidentDate: "",
    accidentTime: "",
    location: "",
    cause: "",
    policeDate: "",
    policeTime: "",
    policeStation: "",
    damageOwnType: "mitrphol",
    damageOtherOwn: "",
    damageDetail: "",
    damageAmount: "",
    victimDetail: "",
    partnerName: "",
    partnerPhone: "",
    partnerLocation: "",
    partnerDamageDetail: "",
    partnerDamageAmount: "",
    partnerVictimDetail: "",
  });
  const [damageOwnType, setDamageOwnType] = useState<"mitrphol" | "other">(
    "mitrphol"
  );
  const [damageOtherOwn, setDamageOtherOwn] = useState("");
  const [damageFiles, setDamageFiles] = useState<File[]>([]);
  const [estimateFiles, setEstimateFiles] = useState<File[]>([]);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    console.log("ABOUT TO SEND HEADER:", API + "/api/users"); // should log a full URL

    fetch(`${API}/api/users`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { users: User[] }) => {
        setApproverList(data.users);
      })
      .catch(console.error);
  }, [status]);
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDamageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // แปลง FileList → File[] ก่อน
    const newFiles = Array.from(files);

    // แล้วสะสมเข้า state
    setDamageFiles((prev) => [...prev, ...newFiles]);
  };

  const handleEstimateFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setEstimateFiles((prev) => [...prev, ...newFiles]);
  };

  const handleOtherFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setOtherFiles((prev) => [...prev, ...newFiles]);
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const data = new FormData();
      // … append all your other fields …

      // indicate which action
      data.set("saveAsDraft", saveAsDraft ? "true" : "false");

      const res = await fetch(`${API}/api/claims`, {
        method: "POST",
        body: data,
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/claims");
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const selectedApprover = approverList.find((a) => a.id === form.approverId);

  // สร้าง preview URLs

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl mb-6">แจ้งอุบัติเหตุ</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* APPROVER DROPDOWN */}
        <div>
          <label htmlFor="approverId" className="block mb-1 font-medium">
            เลือกผู้อนุมัติเอกสาร <span className="text-red-600">*</span>
          </label>
          <select
            id="approverId"
            name="approverId"
            value={form.approverId}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">-- โปรดเลือก --</option>
            {approverList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.position}
              </option>
            ))}
          </select>
        </div>

        {/* ลักษณะอุบัติเหตุ */}
        <fieldset className="border-t pt-4">
          <legend className="font-medium">1. ลักษณะอุบัติเหตุ</legend>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label>
                วันที่เกิดเหตุ <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="accidentDate" // ชื่อตรงกับ state
                value={form.accidentDate} // ตรงกับ key
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label>
                เวลา <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                name="accidentTime" // ชื่อตรงกับ state
                value={form.accidentTime} // ตรงกับ key
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="col-span-2">
              <label>
                ที่อยู่สถานที่เกิดเหตุ <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="col-span-2">
              <label>
                สาเหตุของอุบัติเหตุ <span className="text-red-600">*</span>
              </label>
              <textarea
                name="cause"
                value={form.cause}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
        </fieldset>

        {/* แจ้งความตำรวจ (ถ้ามี) */}
        <fieldset className="border-t pt-4">
          <legend className="font-medium">
            2. การแจ้งความต่อเจ้าหน้าที่ตำรวจ (ถ้ามี)
          </legend>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label>
                วันที่แจ้ง <span className="text-gray-500">(ถ้ามี)</span>
              </label>
              <input
                type="date"
                name="policeDate"
                value={form.policeDate}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label>เวลา</label>
              <input
                type="time"
                name="policeTime"
                value={form.policeTime}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="col-span-2">
              <label>สถานีตำรวจ</label>
              <input
                type="text"
                name="policeStation"
                value={form.policeStation}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
        </fieldset>

        {/* 3. ความเสียหายของทรัพย์สิน */}
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
                checked={damageOwnType === "mitrphol"}
                onChange={() => setDamageOwnType("mitrphol")}
                className="mr-2"
              />
              ทรัพย์สินของกลุ่มมิตรผล
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="damageOwnType"
                value="other"
                checked={damageOwnType === "other"}
                onChange={() => setDamageOwnType("other")}
                className="mr-2"
              />
              ทรัพย์สินของ
            </label>
            <input
              type="text"
              name="damageOtherOwn"
              value={damageOtherOwn}
              onChange={(e) => setDamageOtherOwn(e.target.value)}
              disabled={damageOwnType !== "other"}
              placeholder="ระบุทรัพย์สิน"
              className="border p-2 rounded flex-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label>รายละเอียดความเสียหาย</label>
              <textarea
                name="damageDetail"
                value={form.damageDetail}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label>มูลค่าโดยประมาณ</label>
              <input
                type="number"
                name="damageAmount"
                value={form.damageAmount}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label>รายละเอียดผู้เสียชีวิต/ผู้บาดเจ็บ (หากมี)</label>
              <textarea
                name="victimDetail"
                value={form.victimDetail}
                onChange={handleChange}
                placeholder="ระบุรายละเอียดผู้เสียชีวิตหรือผู้บาดเจ็บ"
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
        </fieldset>

        {/* 4. ความเสียหายคู่กรณี (หากมี) */}
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
                value={form.partnerName}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label>เบอร์โทรศัพท์</label>
              <input
                type="text"
                name="partnerPhone"
                value={form.partnerPhone}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="col-span-2">
              <label>ที่อยู่สถานที่เกิดเหตุ</label>
              <input
                type="text"
                name="partnerLocation"
                value={form.partnerLocation}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="col-span-2">
              <label>รายละเอียดความเสียหายของทรัพย์สิน</label>
              <textarea
                name="partnerDamageDetail"
                value={form.partnerDamageDetail}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label>มูลค่าโดยประมาณ</label>
              <input
                type="number"
                name="partnerDamageAmount"
                value={form.partnerDamageAmount}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label>รายละเอียดผู้เสียชีวิต/ผู้บาดเจ็บ (หากมี)</label>
              <textarea
                name="partnerVictimDetail"
                value={form.partnerVictimDetail}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
        </fieldset>

        {/* แนบเอกสาร */}
        <fieldset className="border-t pt-6 space-y-6">
          <legend className="font-semibold text-lg">แนบเอกสารตามรายการ</legend>

          {/* 1) รูปภาพความเสียหาย */}
          <div>
            <label className="block mb-2 font-medium">
              1) รูปภาพความเสียหาย <span className="text-red-600">*</span>{" "}
              (jpeg/jpg/png/pdf)
            </label>
            <label
              htmlFor="damageFiles"
              className="
                group flex flex-col items-center justify-center
                border-2 border-dashed border-gray-300 hover:border-blue-500
                bg-gray-50 p-6 rounded-lg cursor-pointer
                transition-colors
              "
            >
              <svg
                className="w-8 h-8 text-gray-400 group-hover:text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 4v16m8-8H4" strokeWidth={2} />
              </svg>
              <span className="mt-2 text-gray-600 group-hover:text-blue-600">
                คลิกหรือวางไฟล์ที่นี่
              </span>
              <input
                id="damageFiles"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                onChange={handleDamageFiles}
                className="hidden"
              />
            </label>
            {damageFiles.length > 0 && (
              <ul className="mt-4 space-y-2">
                {damageFiles.map((f) => (
                  <li key={f.name} className="flex items-center text-sm">
                    📎
                    <a
                      href={URL.createObjectURL(f)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 underline text-blue-600"
                    >
                      {f.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 2) เอกสารสำรวจความเสียหาย */}
          <div>
            <label className="block mb-2 font-medium">
              2) เอกสารสำรวจความเสียหาย <span className="text-red-600">*</span>{" "}
              (jpeg/jpg/png/pdf)
            </label>
            <label
              htmlFor="estimateFiles"
              className="
                group flex flex-col items-center justify-center
                border-2 border-dashed border-gray-300 hover:border-blue-500
                bg-gray-50 p-6 rounded-lg cursor-pointer
                transition-colors
              "
            >
              <svg
                className="w-8 h-8 text-gray-400 group-hover:text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 4v16m8-8H4" strokeWidth={2} />
              </svg>
              <span className="mt-2 text-gray-600 group-hover:text-blue-600">
                คลิกหรือวางไฟล์ที่นี่
              </span>
              <input
                id="estimateFiles"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                onChange={handleEstimateFiles}
                className="hidden"
              />
            </label>
            {estimateFiles.length > 0 && (
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                {estimateFiles.map((f) => (
                  <li key={f.name} className="flex items-center">
                    📎
                    <a
                      href={URL.createObjectURL(f)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 underline"
                    >
                      {f.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 3) เอกสารเพิ่มเติมอื่น ๆ */}
          <div>
            <label className="block mb-2 font-medium">
              3) เอกสารเพิ่มเติมอื่น ๆ (jpeg/jpg/png/pdf)
            </label>
            <label
              htmlFor="otherFiles"
              className="
                group flex flex-col items-center justify-center
                border-2 border-dashed border-gray-300 hover:border-blue-500
                bg-gray-50 p-6 rounded-lg cursor-pointer
                transition-colors
              "
            >
              <svg
                className="w-8 h-8 text-gray-400 group-hover:text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 4v16m8-8H4" strokeWidth={2} />
              </svg>
              <span className="mt-2 text-gray-600 group-hover:text-blue-600">
                คลิกหรือวางไฟล์ที่นี่
              </span>
              <input
                id="otherFiles"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                onChange={handleOtherFiles}
                className="hidden"
              />
            </label>
            {otherFiles.length > 0 && (
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                {otherFiles.map((f) => (
                  <li key={f.name} className="flex items-center">
                    📎
                    <a
                      href={URL.createObjectURL(f)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 underline"
                    >
                      {f.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </fieldset>

        {error && <p className="text-red-600">{error}</p>}
        <div className="flex space-x-4">
          <button
            type="button"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, true)}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, false)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
