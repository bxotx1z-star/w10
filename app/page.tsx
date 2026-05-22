'use client';

import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const GroupBlock = ({ name, stats, themeColor, isSummary = false }: any) => {
  const colors: any = { yellow: 'bg-yellow-50', green: 'bg-green-50', pink: 'bg-pink-50', blue: 'bg-blue-50' };
  return (
    <div className={`flex flex-col rounded-2xl p-5 ${colors[themeColor]} border border-slate-100 shadow-sm`}>
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{name} {isSummary ? "" : "เข้า"}</div>
      <div className="text-4xl font-black text-slate-900 mb-5">{stats?.entrance || 0}</div>
      
      <div className="text-[13px] font-medium text-slate-600 space-y-2.5 bg-white/50 p-3.5 rounded-xl border border-white/50">
        <div className="flex justify-between"><span>ยังไม่เสร็จ</span><span className="font-bold text-slate-900">{stats?.left || 0}</span></div>
        <div className="flex justify-between"><span>เสร็จ</span><span className="font-bold text-slate-900">{stats?.finish || 0}</span></div>
        <div className="flex justify-between"><span>อื่น</span><span className="font-bold text-slate-900">{stats?.otherFinish || 0}</span></div>
        <div className="flex justify-between font-bold text-slate-900 pt-2.5 border-t border-slate-200"><span>งานออก</span><span className="text-lg">{stats?.out || 0}</span></div>
      </div>
    </div>
  );
};

const ModernGauge = ({ value, label, themeColor }: any) => {
  const v = Math.min(Math.max(value || 0, -5), 5);
  const colorMap: any = { yellow: '#FFEE57', green: '#57FF6B', pink: '#FF57E9', blue: '#57A0FF' };
  const color = colorMap[themeColor] || '#3b82f6';
  
  const chartData = v < 0 
    ? [
        { name: 'bg-left', value: 5 + v, color: '#f1f5f9' },
        { name: 'active-left', value: Math.abs(v), color: color },
        { name: 'bg-right', value: 5, color: '#f1f5f9' }
      ]
    : [
        { name: 'bg-left', value: 5, color: '#f1f5f9' },
        { name: 'active-right', value: v, color: color },
        { name: 'bg-right', value: 5 - v, color: '#f1f5f9' }
      ];

  return (
    <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm w-full">
       <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">{label}</div>
       <div className="h-20 w-24">
          <ResponsiveContainer width="100%" height="100%">
             <PieChart>
                <Pie data={chartData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={20} outerRadius={30} paddingAngle={0} dataKey="value" stroke="none">
                   {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
             </PieChart>
          </ResponsiveContainer>
       </div>
       <div className="text-[15px] font-black text-slate-800 -mt-4">{value ?? 0}</div>
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("all");
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = (y: string, m: string, isInitial = false) => {
    setError("");
    setIsLoading(true);
    const params = new URLSearchParams();
    if (y) params.append("year", y);
    if (m) params.append("month", m);
    
    fetch(`/api/dashboard?${params.toString()}`, { cache: 'no-store' }).then(async (res) => {
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || 'โหลดข้อมูลไม่สำเร็จ');
      setData(d);
      if (isInitial) {
        if (d.currentYear) setYear(d.currentYear);
        if (d.currentMonth) setMonth(d.currentMonth === 'รวมทุกเดือน' ? 'all' : d.currentMonth);
      }
    }).catch((err: Error) => setError(err.message))
    .finally(() => setIsLoading(false));
  };

  useEffect(() => { 
    import('highcharts/highcharts-3d').then(() => setModulesLoaded(true)).catch(() => setModulesLoaded(true));
    const savedYear = localStorage.getItem('dashboard_year');
    const savedMonth = localStorage.getItem('dashboard_month');
    const initialYear = savedYear || year;
    const initialMonth = savedMonth || month;
    if (savedYear) setYear(initialYear);
    if (savedMonth) setMonth(initialMonth);
    loadDashboard(initialYear, initialMonth, true);
  }, []);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setYear(val);
    localStorage.setItem('dashboard_year', val);
    loadDashboard(val, month);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setMonth(val);
    localStorage.setItem('dashboard_month', val);
    loadDashboard(year, val);
  };

  if (error) return (
    <div className="p-10 text-center">
      <div className="font-bold text-red-600 mb-4">{error}</div>
      <button onClick={() => loadDashboard(year, month)} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">ลองใหม่</button>
    </div>
  );

  if (!data || !modulesLoaded) return <div className="p-10 text-center font-bold text-slate-500 text-lg">กำลังโหลด...</div>;
  const { wGauges = {}, groupStats = {}, w_all = {}, statusData = {}, equipmentData = [] } = data;

  const statusChartOptions = {
    chart: { type: 'pie', height: 250, backgroundColor: 'transparent', options3d: { enabled: true, alpha: 45 } },
    title: { text: '' },
    plotOptions: { pie: { innerSize: '60%', depth: 35, dataLabels: { enabled: true, format: '{point.name}: {point.percentage:.0f}%' } } },
    series: [{ name: 'Status', data: [
        { name: 'SAP', y: statusData?.sap || 0, color: '#22c55e' },
        { name: 'Pending', y: statusData?.pending || 0, color: '#ef4444' },
        { name: 'Finish', y: statusData?.finish || 0, color: '#eab308' }
    ] }]
  };

  const equipChartOptions = {
    chart: { type: 'column', height: 250, backgroundColor: 'transparent', options3d: { enabled: true, alpha: 10, beta: 20, depth: 50 } },
    title: { text: '' },
    xAxis: { categories: ['W11', 'W12', 'W13', 'W14'], gridLineWidth: 0 },
    yAxis: { title: { text: '' }, gridLineWidth: 0 },
    plotOptions: { column: { borderRadius: 4, depth: 25, dataLabels: { enabled: true } } },
    series: equipmentData.map((e: any) => ({
        name: e.name, 
        data: e.values, 
        color: (({'BEML': '#3b82f6', 'Conveyor': '#ef4444', 'สูบน้ำ': '#f59e0b', 'Moblie other': '#10b981', 'power plant': '#f97316', 'General': '#8b5cf6'} as any)[e.name] || '#94a3b8')
    }))
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-800">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">W10 Dashboard</h1>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-900 text-white rounded-xl shadow-sm">
              <span className="text-[11px] font-bold uppercase opacity-80">W_ALL</span>
              <span className="text-xl font-black">{w_all?.entrance || 0}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 text-white rounded-xl shadow-sm">
              <span className="text-[11px] font-bold uppercase opacity-80">W/O</span>
              <span className="text-xl font-black">{statusData?.total || 0}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            {isLoading && <span className="flex items-center text-xs font-bold text-slate-400 animate-pulse mr-2">กำลังอัปเดต...</span>}
            <select className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700" value={year} onChange={handleYearChange}>
              {["2023", "2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700" value={month} onChange={handleMonthChange}>
              <option value="all">รวมทุกเดือน</option>
              {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <a href="/purchasing" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition">จัดซื้อจัดจ้าง</a>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 uppercase text-sm text-slate-500">สถานะการดำเนินงาน</h3>
            <div className="flex flex-col gap-4">
                <HighchartsReact highcharts={Highcharts} options={statusChartOptions} />
                <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-center text-xs font-bold text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-100"><tr><th className="p-2.5">SAP</th><th className="p-2.5">Pending</th><th className="p-2.5">Finish</th><th className="p-2.5 text-slate-900">รวม (W/O)</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 bg-white"><tr><td className="p-2.5">{statusData?.sap || 0}</td><td className="p-2.5">{statusData?.pending || 0}</td><td className="p-2.5">{statusData?.finish || 0}</td><td className="p-2.5 font-black text-slate-900 text-lg">{statusData?.total || 0}</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 uppercase text-sm text-slate-500">งานเข้าตามกลุ่มงาน</h3>
            <div className="flex flex-col gap-4">
                <HighchartsReact highcharts={Highcharts} options={equipChartOptions} />
                <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-center text-[11px] font-bold text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-100 uppercase">
                            <tr><th className="p-2.5">Eq</th><th className="p-2.5">W11</th><th className="p-2.5">W12</th><th className="p-2.5">W13</th><th className="p-2.5">W14</th><th className="p-2.5 text-slate-900">รวม</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {equipmentData.map((e: any) => (
                                <tr key={e.name}>
                                    <td className="p-2.5 text-left font-bold text-slate-700 text-[12px]">{e.name}</td>
                                    <td className="p-2.5">{e.values[0]}</td><td className="p-2.5">{e.values[1]}</td><td className="p-2.5">{e.values[2]}</td><td className="p-2.5">{e.values[3]}</td>
                                    <td className="p-2.5 font-black text-slate-900">{e.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[
            { id: 'W11', name: 'W11', color: 'yellow' },
            { id: 'W12', name: 'W12', color: 'green' },
            { id: 'W13', name: 'W13', color: 'pink' },
            { id: 'W14', name: 'W14', color: 'blue' }
        ].map((w) => {
          const stats = groupStats[w.id];
          const colors: any = { yellow: 'bg-yellow-50', green: 'bg-green-50', pink: 'bg-pink-50', blue: 'bg-blue-50' };
          return (
            <div key={w.id} className={`flex flex-col rounded-2xl p-5 ${colors[w.color]} border border-slate-100 shadow-sm`}>
              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{w.name} เข้า</div>
              <div className="text-4xl font-black text-slate-900 mb-5">{stats?.entrance || 0}</div>
              <div className="text-[14px] font-medium text-slate-600 space-y-2.5 bg-white/50 p-4 rounded-xl border border-white/50">
                <div className="flex justify-between"><span>ยังไม่เสร็จ</span><span className="font-bold text-slate-900">{stats?.left || 0}</span></div>
                <div className="flex justify-between"><span>เสร็จ</span><span className="font-bold text-slate-900">{stats?.finish || 0}</span></div>
                <div className="flex justify-between"><span>อื่น</span><span className="font-bold text-slate-900">{stats?.otherFinish || 0}</span></div>
                <div className="flex justify-between font-bold text-slate-900 pt-2.5 border-t border-slate-200"><span>งานออก</span><span className="text-lg">{stats?.out || 0}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
            { id: 'W11', color: 'yellow' }, { id: 'W12', color: 'green' }, { id: 'W13', color: 'pink' }, { id: 'W14', color: 'blue' }
        ].map((w) => (
          <div key={w.id} className="grid grid-cols-2 gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <ModernGauge value={wGauges[w.id]?.empNorm} label="พนง ปกติ" themeColor={w.color} />
            <ModernGauge value={wGauges[w.id]?.conNorm} label="ลจ ปกติ" themeColor={w.color} />
            <ModernGauge value={wGauges[w.id]?.empOT} label="พนง +OT" themeColor={w.color} />
            <ModernGauge value={wGauges[w.id]?.conOT} label="ลจ +OT" themeColor={w.color} />
          </div>
        ))}
      </div>
    </div>
  );
}
