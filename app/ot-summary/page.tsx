'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, Clock, Filter, RefreshCw, ShoppingCart } from 'lucide-react';

type EmployeeOtRow = {
  sequence: number;
  employeeId: string;
  name: string;
  position: string;
  group: string;
  days: number[];
  holidayHours?: number;
  total: number;
  oneTime?: number;
  oneHalfTime?: number;
  total2: number;
  threeTime?: number;
};

type OtSummaryData = {
  employeeTitle?: string;
  contractorTitle?: string;
  employees?: EmployeeOtRow[];
  contractors?: EmployeeOtRow[];
  error?: string;
};

const formatNumber = (value: number) => Number(value.toFixed(2)).toLocaleString('th-TH', { maximumFractionDigits: 2 });

const contractorTailHeaderClasses = [
  'bg-[#ffd6d6] text-[#dc2626]',
  'bg-[#fff3c4] text-[#d7c900]',
  'bg-white text-[#dc2626]',
  'bg-[#fff3c4] text-[#d7c900]',
  'bg-[#31f4ff] text-[#00a6c8]',
  'bg-white text-[#dc2626]',
];

export default function OtSummaryPage() {
  const [data, setData] = useState<OtSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    setError('');
    fetch('/api/ot-summary', { cache: 'no-store' })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok || payload.error) throw new Error(payload.error || 'โหลดข้อมูลโอทีไม่สำเร็จ');
        setData(payload);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  const contractors = data?.contractors || [];
  const contractorTotals = contractors.reduce(
    (sum, contractor) => ({
      holidayHours: sum.holidayHours + (contractor.holidayHours || 0),
      total: sum.total + contractor.total,
      oneTime: sum.oneTime + (contractor.oneTime || 0),
      oneHalfTime: sum.oneHalfTime + (contractor.oneHalfTime || 0),
      total2: sum.total2 + contractor.total2,
      threeTime: sum.threeTime + (contractor.threeTime || 0),
    }),
    { holidayHours: 0, total: 0, oneTime: 0, oneHalfTime: 0, total2: 0, threeTime: 0 },
  );

  return (
    <div className="min-h-screen bg-[#dedede] p-4 text-slate-900 md:p-8 font-sans">
      <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border-b-4 border-[#ffd56d] shadow-sm shadow-slate-200/70">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5c607f] text-[#ffef9a] shadow-lg shadow-indigo-100/60">
            <Clock size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#4A4A49]">สรุปโอทีลูกจ้างและพนักงาน</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-0.5">EGAT OT Summary</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isLoading && <span className="flex items-center text-xs font-black text-[#d4a300] animate-pulse mr-2 bg-yellow-50 px-2 py-1 rounded-lg uppercase">Updating...</span>}
          <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm font-black text-[#4A4A49] shadow-inner">
            <Filter size={16} className="text-slate-400" />
            พนง B2:AL20 · ลจ B2:AO34
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 md:px-4 py-2 md:py-3 bg-white text-[#4A4A49] rounded-xl md:rounded-2xl text-xs md:text-sm font-black hover:bg-slate-50 border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={16} strokeWidth={3} className={isLoading ? 'animate-spin text-[#d4a300]' : 'text-slate-500'} />
            รีเฟรชข้อมูล
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="px-4 md:px-6 py-2 md:py-3 bg-[#ffe08a] text-[#4A4A49] rounded-xl md:rounded-2xl text-xs md:text-sm font-black hover:bg-[#ffd56a] shadow-lg shadow-yellow-200/50 transition-all active:scale-95 flex items-center gap-2"
            >
              เมนูหน้า
              <ChevronDown size={16} strokeWidth={3} className={menuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40">
                <a href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-slate-50">
                  <ArrowLeft size={18} className="text-slate-500" /> หน้าหลัก
                </a>
                <a href="/purchasing" className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-yellow-50">
                  <ShoppingCart size={18} className="text-[#d4a300]" /> จัดซื้อจัดจ้าง
                </a>
                <a href="/ot-summary" className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm font-black text-[#4A4A49] hover:bg-sky-50">
                  <Clock size={18} className="text-sky-500" /> สรุปโอทีลูกจ้างและพนักงาน
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-6 text-base font-black text-red-700 shadow-sm">{error}</div>
      ) : isLoading || !data ? (
        <div className="flex items-center justify-center gap-3 rounded-[2rem] border-2 border-[#dbeafe] bg-[#e8f5ff]/95 p-20 text-base font-black text-slate-400 shadow-sm animate-pulse uppercase tracking-widest">
          <RefreshCw size={24} className="animate-spin text-[#d4a300]" /> กำลังโหลดข้อมูล...
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl border border-[#efd58d] border-b-[5px] border-b-[#eecb70] bg-[#fff8da] shadow-[0_8px_18px_rgba(234,179,8,0.12)]">
            <div className="border-b border-[#efd58d] bg-[#fffdf1] p-4 md:p-8">
              <h2 className="flex items-center gap-3 text-2xl font-black text-[#061b3d] md:text-4xl">
                <div className="h-8 w-3 rounded-full bg-[#f9a66c] md:h-11"></div>
                รายละเอียด OT พนักงาน
              </h2>
              <p className="mt-2 text-sm font-extrabold text-slate-600">{data.employeeTitle || 'สรุป OT พนักงาน'} · B2:AL20</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1640px] border-collapse border border-[#21324a] text-center text-[13px]">
                <thead className="text-[12px] font-black text-slate-900">
                  <tr>
                    <th colSpan={4} className="border border-slate-700 bg-white px-2 py-2 font-black">
                      <div>มิถุนายน 2569</div>
                      <div>กบย-ช., หสบ-ช. (ล่วงเวลา 30 , 45 ชั่วโมง)</div>
                    </th>
                    <th colSpan={31} className="border border-slate-700 bg-white px-2 py-2 font-black">วันที่</th>
                    <th colSpan={2} className="border border-slate-700 bg-white px-2 py-2 font-black"></th>
                  </tr>
                  <tr>
                    {['ลำดับ', 'เลขประจำตัว', 'ชื่อ', 'ตำแหน่ง', ...Array.from({ length: 31 }, (_, index) => `${index + 1}`), 'รวม', 'รวมx3'].map((header, index) => (
                      <th key={header} className={`border border-slate-700 bg-[#d9d9d9] px-2 py-2 font-black whitespace-nowrap ${index >= 35 ? 'bg-[#ffd119] text-[#061b3d]' : ''}`}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.employees || []).map((employee, index) => (
                    <tr key={`${employee.employeeId}-${employee.sequence}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#e4f5ed]'}>
                      <td className="border border-slate-700 px-2 py-2 font-bold">{employee.sequence}</td>
                      <td className="border border-slate-700 px-2 py-2 font-bold">{employee.employeeId}</td>
                      <td className="border border-slate-700 px-3 py-2 text-left font-bold whitespace-nowrap">{employee.name}</td>
                      <td className="border border-slate-700 px-2 py-2 font-bold">{employee.position}</td>
                      {employee.days.map((value, dayIndex) => (
                        <td key={`${employee.employeeId}-${dayIndex}`} className="border border-slate-700 px-2 py-2 font-bold">
                          {value ? formatNumber(value) : '-'}
                        </td>
                      ))}
                      <td className="border border-slate-700 bg-[#ffd119] px-2 py-2 font-black text-[#4A4A49]">{formatNumber(employee.total)}</td>
                      <td className="border border-slate-700 bg-[#ffd119] px-2 py-2 font-black text-[#4A4A49]">{formatNumber(employee.total2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 overflow-hidden rounded-3xl border border-[#f4bfd2] border-b-[5px] border-b-[#f1a9c4] bg-[#fff0f6] shadow-[0_8px_18px_rgba(244,114,182,0.12)]">
            <div className="border-b border-[#f4bfd2] bg-[#fff8fb] p-4 md:p-8">
              <h2 className="flex items-center gap-3 text-2xl font-black text-[#061b3d] md:text-4xl">
                <div className="h-8 w-3 rounded-full bg-[#f9a8d4] md:h-11"></div>
                รายละเอียด OT ลูกจ้าง
              </h2>
              <p className="mt-2 text-sm font-extrabold text-slate-600">{data.contractorTitle || 'สรุป OT ลูกจ้าง'} · B2:AO34</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1360px] table-fixed border-collapse border border-[#21324a] text-center text-[11px]">
                <colgroup>
                  <col className="w-[42px]" />
                  <col className="w-[48px]" />
                  <col className="w-[160px]" />
                  {Array.from({ length: 31 }, (_, index) => (
                    <col key={`contractor-day-col-${index}`} className="w-[24px]" />
                  ))}
                  {Array.from({ length: 6 }, (_, index) => (
                    <col key={`contractor-total-col-${index}`} className={index === 4 ? 'w-[70px]' : 'w-[54px]'} />
                  ))}
                </colgroup>
                <thead className="text-[10px] font-black text-slate-900">
                  <tr>
                    <th colSpan={3} className="border border-slate-700 bg-white px-1 py-1 font-black">ล่วงเวลาลูกจ้าง มิถุนายน 2569</th>
                    <th colSpan={31} className="border border-slate-700 bg-white px-1 py-1 font-black">วันที่</th>
                    <th colSpan={2} className="border border-slate-700 bg-white px-1 py-1 font-black"></th>
                    <th className="border border-slate-700 bg-white px-1 py-1 font-black text-[#dc2626]">1เท่า</th>
                    <th className="border border-slate-700 bg-[#fff3c4] px-1 py-1 font-black text-[#d7c900]">1.5เท่า</th>
                    <th className="border border-slate-700 bg-white px-1 py-1 font-black text-[#00a6c8]">ยอดจ่าย</th>
                    <th className="border border-slate-700 bg-white px-1 py-1 font-black text-[#dc2626]">3เท่า</th>
                  </tr>
                  <tr>
                    {['ลำดับ', 'หมวด', 'ชื่อ', ...Array.from({ length: 31 }, (_, index) => `${index + 1}`), 'ชม.วันหยุด', 'รวมชม1.5', '61.63', '92.44', 'รวมเงิน', '184.89'].map((header, index) => (
                      <th key={header} className={`border border-slate-700 bg-[#d9d9d9] px-0.5 py-1 font-black leading-tight ${index === 2 ? 'text-left' : ''} ${index >= 34 ? contractorTailHeaderClasses[index - 34] : ''}`}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contractors.map((contractor, index) => (
                    <tr key={`${contractor.group}-${contractor.sequence}-${contractor.name}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#fce7f3]'}>
                      <td className="border border-slate-700 px-0.5 py-1 font-bold">{contractor.sequence}</td>
                      <td className="border border-slate-700 px-0.5 py-1 font-black text-[#4A4A49]">{contractor.group}</td>
                      <td className="truncate border border-slate-700 px-1 py-1 text-left font-bold" title={contractor.name}>{contractor.name}</td>
                      {contractor.days.map((value, dayIndex) => (
                        <td key={`${contractor.group}-${contractor.sequence}-${dayIndex}`} className="border border-slate-700 px-0.5 py-1 font-bold">
                          {value ? formatNumber(value) : '-'}
                        </td>
                      ))}
                      <td className="border border-slate-700 bg-[#ffd6d6] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(contractor.holidayHours || 0)}</td>
                      <td className="border border-slate-700 bg-[#fff3c4] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(contractor.total)}</td>
                      <td className="border border-slate-700 bg-[#ffd6d6] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(contractor.oneTime || 0)}</td>
                      <td className="border border-slate-700 bg-[#fff3c4] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(contractor.oneHalfTime || 0)}</td>
                      <td className="border border-slate-700 bg-[#31f4ff] px-0.5 py-1 font-black text-[#004851]">{formatNumber(contractor.total2)}</td>
                      <td className="border border-slate-700 bg-[#f1ddc9] px-0.5 py-1 font-black text-[#4A4A49]">{formatNumber(contractor.threeTime || 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#e4f5ed]">
                    <td colSpan={34} className="border border-slate-700 px-2 py-2 text-right font-black text-[#061b3d]">ยอดรวมสุทธิ</td>
                    <td className="border border-slate-700 bg-[#ffd6d6] px-0.5 py-2 font-black text-[#4A4A49]">{formatNumber(contractorTotals.holidayHours)}</td>
                    <td className="border border-slate-700 bg-[#fff3c4] px-0.5 py-2 font-black text-[#4A4A49]">{formatNumber(contractorTotals.total)}</td>
                    <td className="border border-slate-700 bg-[#ffd6d6] px-0.5 py-2 font-black text-[#4A4A49]">{formatNumber(contractorTotals.oneTime)}</td>
                    <td className="border border-slate-700 bg-[#fff3c4] px-0.5 py-2 font-black text-[#4A4A49]">{formatNumber(contractorTotals.oneHalfTime)}</td>
                    <td className="border border-slate-700 bg-[#31f4ff] px-0.5 py-2 font-black text-[#004851]">{formatNumber(contractorTotals.total2)}</td>
                    <td className="border border-slate-700 bg-[#f1ddc9] px-0.5 py-2 font-black text-[#4A4A49]">{formatNumber(contractorTotals.threeTime)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
