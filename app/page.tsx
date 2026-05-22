'use client';

import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ModernGauge = ({ value, label, themeColor }: any) => {
  const v = Math.min(Math.max(value || 0, -5), 5);
  const colorMap: any = { yellow: '#FFEE57', green: '#57FF6B', pink: '#FF57E9', blue: '#57A0FF' };
  const color = colorMap[themeColor] || '#3b82f6';
  
  const data = [
    { name: 'val', value: v + 5, color: color },
    { name: 'rem', value: 10 - (v + 5), color: '#f1f5f9' }
  ];

  return (
    <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm w-full">
       <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">{label}</div>
       <div className="h-20 w-24">
          <ResponsiveContainer width="100%" height="100%">
             <PieChart>
                <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={20} outerRadius={30} paddingAngle={0} dataKey="value" stroke="none">
                   <Cell fill={color} /><Cell fill="#e2e8f0" />
                </Pie>
             </PieChart>
          </ResponsiveContainer>
       </div>
       <div className="text-sm font-black text-slate-800 -mt-4">{value ?? 0}</div>
    </div>
  );
};

const GroupBlock = ({ name, stats, themeColor, isSummary = false }: any) => {
  const colors: any = { yellow: 'bg-yellow-50', green: 'bg-green-50', pink: 'bg-pink-50', blue: 'bg-blue-50' };
  return (
    <div className={`flex flex-col rounded-xl p-4 ${colors[themeColor]} border border-slate-100 shadow-sm`}>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{name} {isSummary ? "" : "เข้า"}</div>
      <div className="text-3xl font-black text-slate-900 mb-4">{stats?.entrance || 0}</div>
      <div className="text-[11px] font-medium text-slate-600 space-y-1">
        <div className="flex justify-between"><span>ยังไม่เสร็จ</span><span className="font-bold">{stats?.left || 0}</span></div>
        <div className="flex justify-between"><span>เสร็จ</span><span className="font-bold">{stats?.finish || 0}</span></div>
        <div className="flex justify-between"><span>อื่น</span><span className="font-bold">{stats?.otherFinish || 0}</span></div>
        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200"><span>งานออก</span><span>{stats?.out || 0}</span></div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = () => {
    setError("");
    fetch(`/api/dashboard`).then(async (res) => {
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || 'โหลดข้อมูลไม่สำเร็จ');
      setData(d);
      if (d.currentYear) setYear(d.currentYear);
      if (d.currentMonth) setMonth(d.currentMonth);
    }).catch((err: Error) => setError(err.message));
  };

  useEffect(() => { 
    import('highcharts/highcharts-3d').then(() => setModulesLoaded(true)).catch(() => setModulesLoaded(true));
    
    loadDashboard();
  }, []);

  if (error) return <div className="p-10 text-center font-bold text-red-600">{error}</div>;
  if (!data || !modulesLoaded) return <div className="p-10 text-center font-bold text-slate-500">กำลังโหลด...</div>;
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
        // @ts-expect-error Equipment names come from sheet data.
        name: e.name, data: e.values, color: {'BEML': '#3b82f6', 'Conveyor': '#ef4444', 'สูบน้ำ': '#f59e0b', 'Moblie other': '#10b981', 'power plant': '#f97316', 'General': '#8b5cf6'}[e.name] || '#94a3b8' 
    }))
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-800">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">W10 Dashboard</h1>
        <div className="flex gap-2">
            <select className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-500" value={year} disabled>{["2023", "2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}</select>
            <select className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-500" value={month} disabled>{['รวมทุกเดือน', ...Array.from({ length: 12 }, (_, i) => i + 1)].map(m => <option key={m} value={m}>{m}</option>)}</select>
            <a href="/purchasing" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition">จัดซื้อจัดจ้าง</a>
        </div>
      </header>

      <div className="mb-8">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 uppercase text-sm text-slate-500">สถานะการดำเนินงาน</h3>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(420px,1fr)_minmax(360px,0.9fr)] items-center gap-8">
                <div><HighchartsReact highcharts={Highcharts} options={statusChartOptions} /></div>
                <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-center text-xs font-bold text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-100"><tr><th className="p-2">SAP</th><th className="p-2">Pending</th><th className="p-2">Finish</th><th className="p-2">รวม</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 bg-white"><tr><td className="p-2">{statusData?.sap || 0}</td><td className="p-2">{statusData?.pending || 0}</td><td className="p-2">{statusData?.finish || 0}</td><td className="p-2">{statusData?.total || 0}</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-5 gap-4 mb-8">
            <GroupBlock name="W11" stats={groupStats.W11} themeColor="yellow" />
            <GroupBlock name="W12" stats={groupStats.W12} themeColor="green" />
            <GroupBlock name="W13" stats={groupStats.W13} themeColor="pink" />
            <GroupBlock name="W14" stats={groupStats.W14} themeColor="blue" />
            <div className="flex flex-col border border-slate-100 rounded-2xl p-4 bg-blue-50 shadow-sm">
              <div className="text-xs font-bold text-blue-500 uppercase mb-2">W_ALL</div>
              <div className="text-4xl font-black text-blue-900">{w_all?.entrance || 0}</div>
            </div>
        </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
            { id: 'W11', color: 'yellow' },
            { id: 'W12', color: 'green' },
            { id: 'W13', color: 'pink' },
            { id: 'W14', color: 'blue' }
        ].map((w) => (
          <div key={w.id} className="grid grid-cols-2 gap-2 p-3 bg-white rounded-2xl shadow-sm">
            <ModernGauge value={wGauges[w.id]?.empNorm} label="พนง ปกติ" themeColor={w.color} />
            <ModernGauge value={wGauges[w.id]?.conNorm} label="ลจ ปกติ" themeColor={w.color} />
            <ModernGauge value={wGauges[w.id]?.empOT} label="พนง +OT" themeColor={w.color} />
            <ModernGauge value={wGauges[w.id]?.conOT} label="ลจ +OT" themeColor={w.color} />
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm mb-8">
        <h3 className="font-bold text-slate-900 mb-6 uppercase text-sm text-slate-500">งานเข้าตามกลุ่มงาน</h3>
        <div className="flex items-center gap-6">
            <div className="w-2/3"><HighchartsReact highcharts={Highcharts} options={equipChartOptions} /></div>
            <div className="w-1/3 overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-center text-xs font-bold text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100 uppercase">
                        <tr><th className="p-2">Eq</th><th className="p-2">W11</th><th className="p-2">W12</th><th className="p-2">W13</th><th className="p-2">W14</th><th className="p-2">รวม</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {equipmentData.map((e: any) => (
                            <tr key={e.name}>
                                <td className="p-2 text-left font-bold">{e.name}</td>
                                <td className="p-2">{e.values[0]}</td>
                                <td className="p-2">{e.values[1]}</td>
                                <td className="p-2">{e.values[2]}</td>
                                <td className="p-2">{e.values[3]}</td>
                                <td className="p-2 font-black">{e.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
