"use client"

import { useState, ChangeEvent, FormEvent } from "react"

export interface FPPA04FormValues {
  eventType:         string
  claimRefNumber:    string
  eventDescription:  string
  productionYear:    string
  accidentDate:      string
  reportedDate:      string
  receivedDocDate:   string
  company:           string
  factory:           string
  policyNumber:      string
  surveyorRefNumber: string

  items: {
    category:    string
    description: string
    total:       string
    exception:   string
  }[]

  adjustments: {
    type:        "บวก" | "หัก"
    description: string
    amount:      string
  }[]

  signatureFiles?: string[]
}

interface Props {
  initialData?: FPPA04FormValues
  onSave: (data: FPPA04FormValues) => void
}

export default function FPPA04Form({ initialData, onSave }: Props) {
  const blank = {
    eventType: "", claimRefNumber: "", eventDescription: "",
    productionYear: "", accidentDate: "", reportedDate: "",
    receivedDocDate: "", company: "", factory: "",
    policyNumber: "", surveyorRefNumber: "",
    items: [], adjustments: [], signatureFiles: []
  }
  const [data, setData] = useState<FPPA04FormValues>(initialData || blank)

  const handleField = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setData(d => ({ ...d, [name]: value }))
  }

  const updateItem = (i:number, key: keyof typeof data.items[0], val:string) => {
    const items = [...data.items]
    items[i] = { ...items[i], [key]: val }
    setData(d => ({ ...d, items }))
  }
  const addItem = () =>
    setData(d => ({
      ...d,
      items: [...d.items, { category:"", description:"", total:"0", exception:"0" }]
    }))

  const updateAdj = (i:number, key: keyof typeof data.adjustments[0], val:string) => {
    const adj = [...data.adjustments]
    adj[i] = { ...adj[i], [key]: val as any }
    setData(d => ({ ...d, adjustments: adj }))
  }
  const addAdj = () =>
    setData(d => ({
      ...d,
      adjustments: [...d.adjustments, { type:"บวก", description:"", amount:"0" }]
    }))

  const parseNum = (s:string) => parseFloat(s)||0
  const sumTotal  = data.items.reduce((s,it)=>s+parseNum(it.total),0)
  const sumExcept = data.items.reduce((s,it)=>s+parseNum(it.exception),0)
  const covered   = sumTotal - sumExcept
  const adjSum    = data.adjustments.reduce(
    (s,a)=>s + (a.type==="บวก"?parseNum(a.amount):-parseNum(a.amount)),0)
  const netPay = covered + adjSum

  const handleSubmit = (e:FormEvent) => {
    e.preventDefault()
    onSave(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Grid 2 cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          ["ประเภทกรมธรรม์",       "eventType"],
          ["หมายเลขรับ Claim",     "claimRefNumber"],
          ["ปีรถที่ผลิต",         "productionYear"],
          ["วันที่เกิดเหตุ",       "accidentDate"],
          ["วันที่รับแจ้ง",         "reportedDate"],
          ["วันที่ได้รับเอกสาร",    "receivedDocDate"],
          ["บริษัท",              "company"],
          ["โรงงาน",              "factory"],
          ["เลขที่กรมธรรม์",       "policyNumber"],
          ["เลขที่ Claim Surveyor","surveyorRefNumber"],
        ].map(([label,name])=>(
          <div key={name}>
            <label className="block mb-1 text-gray-700 font-medium">{label}</label>
            <input
              name={name}
              value={(data as any)[name]}
              onChange={handleField}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-300"
            />
          </div>
        ))}
      </div>

      {/* Items Table */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">รายการแจ้งเคลมประกัน</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-blue-50">
              <tr>
                {["รายการ", "รายละเอียด", "รวม", "ข้อยกเว้น", "ภายใต้ความคุ้มครอง"].map(h=>(
                  <th key={h} className="border px-3 py-2 text-left text-blue-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((it,i)=>(
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border p-1">
                    <input
                      value={it.category}
                      onChange={e=>updateItem(i,"category",e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      value={it.description}
                      onChange={e=>updateItem(i,"description",e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="number"
                      value={it.total}
                      onChange={e=>updateItem(i,"total",e.target.value)}
                      className="w-full px-2 py-1 border rounded text-right"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="number"
                      value={it.exception}
                      onChange={e=>updateItem(i,"exception",e.target.value)}
                      className="w-full px-2 py-1 border rounded text-right"
                    />
                  </td>
                  <td className="border p-1 text-right">
                    {(parseNum(it.total) - parseNum(it.exception)).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-semibold">
                <td colSpan={2} className="border px-3 py-2 text-center">รวม</td>
                <td className="border px-3 py-2 text-right">{sumTotal.toFixed(2)}</td>
                <td className="border px-3 py-2 text-right">{sumExcept.toFixed(2)}</td>
                <td className="border px-3 py-2 text-right">{covered.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="text-blue-600 hover:underline text-sm"
        >
          + เพิ่มรายการ
        </button>
      </div>

      {/* Adjustments Table */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">รายการบวก/หัก</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-blue-50">
              <tr>
                {["บวก/หัก", "รายละเอียด", "จำนวนเงิน"].map(h=>(
                  <th key={h} className="border px-3 py-2 text-left text-blue-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.adjustments.map((a,i)=>(
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border p-1">
                    <select
                      value={a.type}
                      onChange={e=>updateAdj(i,"type",e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    >
                      <option>บวก</option>
                      <option>หัก</option>
                    </select>
                  </td>
                  <td className="border p-1">
                    <input
                      value={a.description}
                      onChange={e=>updateAdj(i,"description",e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="number"
                      value={a.amount}
                      onChange={e=>updateAdj(i,"amount",e.target.value)}
                      className="w-full px-2 py-1 border rounded text-right"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-semibold">
                <td colSpan={2} className="border px-3 py-2 text-center">รวม</td>
                <td className="border px-3 py-2 text-right">{adjSum.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addAdj}
          className="text-blue-600 hover:underline text-sm"
        >
          + เพิ่มรายการ
        </button>
      </div>

      {/* Net Payable */}
      <div className="flex items-center space-x-4">
        <label className="font-medium text-gray-800">เงินรับค่าสินไหมสุทธิ</label>
        <input
          readOnly
          value={netPay.toFixed(2)}
          className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-right"
        /> บาท
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
      >
        บันทึก FPPA04
      </button>
    </form>
  )
}
