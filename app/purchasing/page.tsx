'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, ClipboardList, Filter, RefreshCw, Search, ShoppingCart } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Cell, Pie, PieChart } from 'recharts';

type GaugeData = { empNorm?: number; empOT?: number; w11_1?: number; };
type NameValue = { name: string; value: number; };
type PairRow = { col1: string; col2: string | number; };
type PurchaseRow = { ecm_buy: string; ecm: string; wo: string; item: string; equip: string; date_in: string; date_start: string; date_out: string; status: string; action: string; };
type PurchasingData = { gauges?: GaugeData; chartData?: NameValue[]; summaryTableData?: PairRow[]; secondChartData?: NameValue[]; secondTableData?: PairRow[]; purchaseList?: PurchaseRow[]; currentYear?: string; currentMonth?: string; error?: string; };

const chartColors = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#7c3aed', '#db2777', '#0891b2', '#ea580c'];

const ModernGauge = ({ value, label }: { value?: number; label: string }) => {
  const safeValue = Number.isFinite(value) ? value || 0 : 0;
  const clamped = Math.min(Math.max(safeValue, -5), 5);
  const data = [{ name: 'value', value: clamped + 5 }, { name: 'remaining', value: 10 - (clamped + 5) }];

  return (
    <div className="flex h-full flex-col items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
      <div className="whitespace-nowrap text-center text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="h-24 w-28">
        <PieChart width={112} height={96}>
          <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={24} outerRadius={36} dataKey="value" stroke="none">
            <Cell fill="#2563eb" /><Cell fill="#e2e8f0" />
          </Pie>
        </PieChart>
      </div>
      <div className="-mt-5 text-[15px] font-black text-slate-900">{safeValue}</div>
    </div>
  );
};

const StatCard = ({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'blue' | 'emerald' | 'amber' | 'slate' }) => {
  if (tone === 'emerald' || tone === 'amber') return null;
  const toneClasses = { blue: 'bg-blue-50 text-blue-900 border-blue-100', emerald: 'bg-emerald-50 text-emerald-900 border-emerald-100', amber: 'bg-amber-50 text-amber-900 border-amber-100', slate: 'bg-white text-slate-900 border-slate-200' };
  return (
    <div className={`order-last rounded-lg border p-4 shadow-sm ${toneClasses[tone]}`}>
      <div className="whitespace-nowrap text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
};

export default function PurchasingPage() {
  const [data, setData] = useState<PurchasingData | null>(null);
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("all");
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    import('highcharts/highcharts-3d').then(() => setModulesLoaded(true)).catch(() => setModulesLoaded(true));
    const savedYear = localStorage.getItem('dashboard_year');
    const savedMonth = localStorage.getItem('dashboard_month');
    const initialYear = savedYear || year;
    const initialMonth = savedMonth || month;
    if (savedYear) setYear(initialYear);
    if (savedMonth) setMonth(initialMonth);
    loadData(initialYear, initialMonth, true);
  }, []);

  const loadData = (y: string, m: string, isInitial = false) => {
    setIsLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (y) params.append("year", y);
    if (m) params.append("month", m);
    fetch(`/api/purchasing?${params.toString()}`, { cache: 'no-store' }).then((res) => { if (!res.ok) throw new Error('โหลดข้อมูลจัดซื้อไม่สำเร็จ'); return res.json(); }).then((payload: PurchasingData) => { if (payload.error) throw new Error(payload.error); setData(payload); if (isInitial) { if (payload.currentYear) setYear(payload.currentYear); if (payload.currentMonth) setMonth(payload.currentMonth === 'รวมทุกเดือน' ? 'all' : payload.currentMonth); } }).catch((err: Error) => { setError(err.message); }).finally(() => setIsLoading(false));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const val = e.target.value; setYear(val); localStorage.setItem('dashboard_year', val); loadData(val, month); };
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const val = e.target.value; setMonth(val); localStorage.setItem('dashboard_month', val); loadData(year, val); };

  const gauges = data?.gauges || {};
  const chartData = data?.chartData || [];
  const summaryTableData = data?.summaryTableData || [];
  const secondChartData = data?.secondChartData || [];
  const secondTableData = data?.secondTableData || [];
  const purchaseList = data?.purchaseList || [];

  const statusOptions = useMemo(() => { const statuses = purchaseList.map((row) => row.status).filter(Boolean); return ['all', ...Array.from(new Set(statuses))]; }, [purchaseList]);
  const primaryChartData = chartData.map((item) => ({ name: item.name || '-', y: item.value || 0 })).filter((item) => item.y > 0);
  const secondaryChartData = secondChartData.map((item, index) => ({ name: item.name || '-', y: item.value || 0, color: chartColors[index % chartColors.length] })).filter((item) => item.name !== '-');
  const hasSecondaryChartData = secondaryChartData.length > 0;
  const filteredRows = useMemo(() => { const normalizedQuery = query.trim().toLowerCase(); return purchaseList.filter((row) => { const matchesStatus = statusFilter === 'all' || row.status === statusFilter; const matchesQuery = !normalizedQuery || Object.values(row).some((value) => value?.toString().toLowerCase().includes(normalizedQuery)); return matchesStatus && matchesQuery; }); }, [purchaseList, query, statusFilter]);
  const chartOptions = { chart: { type: 'pie', backgroundColor: 'transparent', options3d: { enabled: true, alpha: 45 }, height: 280 }, colors: chartColors, credits: { enabled: false }, title: { text: '' }, plotOptions: { pie: { innerSize: '58%', depth: 38, colorByPoint: true, dataLabels: { enabled: true, format: '{point.name}: {point.percentage:.0f}%', style: { fontWeight: '700', textOutline: 'none' } } } }, series: [{ name: 'Purchasing', data: primaryChartData }] };
  const equipChartOptions = { chart: { type: 'column', backgroundColor: 'transparent', options3d: { enabled: true, alpha: 8, beta: 12, depth: 45 }, height: 280 }, credits: { enabled: false }, title: { text: '' }, xAxis: { categories: secondaryChartData.map((item) => item.name), lineColor: '#e2e8f0' }, yAxis: { title: { text: '' }, gridLineColor: '#f1f5f9' }, legend: { enabled: false }, plotOptions: { column: { borderRadius: 4, depth: 24, dataLabels: { enabled: true } } }, series: [{ name: 'จำนวน', data: secondaryChartData }] };
  const totalSummary = summaryTableData.reduce((sum, row) => sum + (parseFloat(row.col2?.toString().replace(/[^0-9.-]/g, '')) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <a href="/" className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"><ArrowLeft size={16} /> กลับหน้าหลัก</a>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white"><ShoppingCart size={22} /></div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">การจัดซื้อจัดจ้าง</h1>
              <p className="text-sm font-semibold text-slate-500">สรุปสถานะจัดซื้อจัดจ้างและรายการดำเนินการ</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          {isLoading && <span className="flex items-center text-xs font-bold text-slate-400 animate-pulse mr-2">กำลังอัปเดต...</span>}
          <Filter size={16} className="ml-2 text-slate-500" />
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none" value={year} onChange={handleYearChange}>
            {['2023', '2024', '2025', '2026'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold outline-none" value={month} onChange={handleMonthChange}>
            <option value="all">รวมทุกเดือน</option>
            {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>
      ) : isLoading || !modulesLoaded ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-10 text-sm font-bold text-slate-500 shadow-sm"><RefreshCw size={16} className="animate-spin" /> กำลังโหลดข้อมูล</div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)]">
            <section className="grid grid-cols-1 gap-4">
              <StatCard label="W11-1" value={gauges.w11_1 || 0} tone="blue" />
              <StatCard label="รายการทั้งหมด" value={purchaseList.length} tone="emerald" />
              <StatCard label="รายการที่แสดง" value={filteredRows.length} tone="amber" />
              <div className="order-first grid grid-cols-1 gap-4">
                <ModernGauge value={gauges.empNorm} label="พนักงานปกติ" />
                <ModernGauge value={gauges.empOT} label="ปกติ + OT" />
              </div>
            </section>
            <section className="contents">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3"><h2 className="whitespace-nowrap text-sm font-black uppercase tracking-wide text-slate-700">ปริมาณการซื้อ/จ้างหมวด</h2><ClipboardList size={18} className="text-slate-400" /></div>
                <div className="grid grid-cols-1 items-center gap-5">
                  {primaryChartData.length > 0 ? <HighchartsReact highcharts={Highcharts} options={chartOptions} /> : <div className="flex h-[280px] items-center justify-center rounded-lg bg-slate-50 text-sm font-bold text-slate-500">ไม่มีข้อมูลกราฟ</div>}
                  <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-max text-center text-sm font-bold"><thead className="bg-slate-50 text-slate-600"><tr>{summaryTableData.map((row, index) => <th key={`${row.col1}-${index}`} className="whitespace-nowrap p-3">{row.col1 || '-'}</th>)}</tr></thead><tbody><tr>{summaryTableData.map((row, index) => <td key={`${row.col2}-${index}`} className="whitespace-nowrap border-t border-slate-100 p-3 text-slate-900">{row.col2 || 0}</td>)}</tr></tbody></table></div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3"><h2 className="whitespace-nowrap text-sm font-black uppercase tracking-wide text-slate-700">สถานะการซื้อจ้าง</h2><CalendarDays size={18} className="text-slate-400" /></div>
                {hasSecondaryChartData ? <HighchartsReact highcharts={Highcharts} options={equipChartOptions} /> : <div className="flex h-[280px] items-center justify-center rounded-lg bg-slate-50 text-sm font-bold text-slate-500">ไม่มีข้อมูลกราฟ</div>}
                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-max text-center text-sm font-bold"><thead className="bg-slate-50 text-slate-600"><tr>{secondTableData.map((row, index) => <th key={`${row.col1}-${index}`} className="whitespace-nowrap p-3">{row.col1 || '-'}</th>)}</tr></thead><tbody><tr>{secondTableData.map((row, index) => <td key={`${row.col2}-${index}`} className="whitespace-nowrap border-t border-slate-100 p-3 text-slate-900">{row.col2 || 0}</td>)}</tr></tbody></table></div>
              </div>
            </section>
          </div>
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div><h2 className="whitespace-nowrap text-sm font-black uppercase tracking-wide text-slate-700">รายละเอียดรายการจัดซื้อจัดจ้าง</h2><p className="mt-1 text-sm font-semibold text-slate-500">ยอดรวมตามตารางสรุป: {totalSummary}</p></div>
              <div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold outline-none focus:border-slate-400 sm:w-64" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหา ECM, W/O, รายการ" /></div></div>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{['ECM ซื้อจ้าง', 'ECM', 'W/O', 'รายการ', 'Equip', 'Date เข้า', 'Date เริ่มงาน', 'Date ออกงาน', 'สถานะ', 'การดำเนินการ'].map((header) => <th key={header} className="border-b border-slate-200 px-4 py-3 font-black">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredRows.length > 0 ? filteredRows.map((row, index) => (<tr key={`${row.ecm_buy}-${row.wo}-${index}`} className="hover:bg-slate-50"><td className="px-4 py-3 font-bold text-slate-900">{row.ecm_buy || '-'}</td><td className="px-4 py-3">{row.ecm || '-'}</td><td className="px-4 py-3">{row.wo || '-'}</td><td className="max-w-[320px] px-4 py-3 font-semibold text-slate-700">{row.item || '-'}</td><td className="px-4 py-3">{row.equip || '-'}</td><td className="px-4 py-3">{row.date_in || '-'}</td><td className="px-4 py-3">{row.date_start || '-'}</td><td className="px-4 py-3">{row.date_out || '-'}</td><td className="px-4 py-3"><span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">{row.status || '-'}</span></td><td className="px-4 py-3">{row.action || '-'}</td></tr>)) : (<tr><td className="px-4 py-10 text-center text-sm font-bold text-slate-500" colSpan={10}>ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>)}</tbody></table></div>
          </section>
        </>
      )}
    </div>
  );
}
