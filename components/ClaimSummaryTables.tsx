// src/components/ClaimSummaryTables.tsx
import React from 'react'

export interface ClaimItem {
  description: string
  detail:      string
  total:       number
  exception:   number
}

export interface Adjustment {
  type:        'บวก' | 'หัก'
  description: string
  amount:      number
}

interface Props {
  claimItems: ClaimItem[]
  adjustments: Adjustment[]
}

export default function ClaimSummaryTables({ claimItems, adjustments }: Props) {
  // compute sums
  const sumTotal     = claimItems.reduce((s, i) => s + i.total, 0)
  const sumExcept    = claimItems.reduce((s, i) => s + i.exception, 0)
  const covered      = sumTotal - sumExcept
  const adjSum       = adjustments.reduce((s, a) => s + (a.type==='บวก'?a.amount:-a.amount), 0)
  const netPayable   = covered + adjSum

  return (
    <div className="space-y-8">
      {/* รายการแจ้งเคลมประกัน */}
      <div>
        <h2 className="font-semibold mb-2">รายการแจ้งเคลมประกัน</h2>
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">รายการ</th>
              <th className="p-2">รายละเอียด (เอกสารแบบ 1)</th>
              <th className="p-2">รวม</th>
              <th className="p-2">ข้อยกเว้น</th>
              <th className="p-2">ภายใต้ความคุ้มครอง</th>
            </tr>
          </thead>
          <tbody>
            {claimItems.map((i, idx)=>(
              <tr key={idx}>
                <td className="border p-2">{i.description}</td>
                <td className="border p-2">{i.detail}</td>
                <td className="border p-2 text-right">{i.total.toFixed(2)}</td>
                <td className="border p-2 text-right">{i.exception.toFixed(2)}</td>
                <td className="border p-2 text-right">{(i.total - i.exception).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold">
              <td colSpan={2} className="p-2 text-center">รวม</td>
              <td className="p-2 text-right">{sumTotal.toFixed(2)}</td>
              <td className="p-2 text-right">{sumExcept.toFixed(2)}</td>
              <td className="p-2 text-right">{covered.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* รายการบวก/หัก */}
      <div>
        <h2 className="font-semibold mb-2">รายการบวก/หัก</h2>
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">บวก/หัก</th>
              <th className="p-2">รายละเอียด</th>
              <th className="p-2">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((a,idx)=>(
              <tr key={idx}>
                <td className="border p-2">{a.type}</td>
                <td className="border p-2">{a.description}</td>
                <td className="border p-2 text-right">{a.amount.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold">
              <td colSpan={2} className="p-2 text-center">รวม</td>
              <td className="p-2 text-right">{adjSum.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* สรุปสุทธิ */}
      <div className="flex items-center">
        <label className="mr-4 font-semibold">เงินรับค่าสินไหมสุทธิ</label>
        <input
          readOnly
          value={netPayable.toFixed(2)}
          className="flex-1 bg-gray-100 border px-3 py-2 rounded text-right"
        /> บาท
      </div>
    </div>
  )
}
