import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/googleSheet';

export async function GET(request: Request) {
  try {

    const data = await getDashboardData();

    if (!data) {
      throw new Error('No data retrieved from sheet');
    }

    // Dashboard W10 All
    const rawData = data.dashboard;

    // Dashboard W10 All info
    const infoData = data.info;

    // ใช้สำหรับกราฟ/summary
    const getNum = (r: number, c: number) => {
      const val = infoData[r]?.[c];

      return parseFloat(
        val?.toString().replace(/[^0-9.-]/g, '')
      ) || 0;
    };

    const currentYear =
      infoData[0]?.[2]?.toString() || '2026';

    const currentMonth =
      infoData[1]?.[2]?.toString() || '5';

    // gauge
    const gauges = {
      empNorm: getNum(3, 81),
      empOT: getNum(4, 81),
      w11_1: getNum(9, 74)
    };

    // =========================
    // PIE CHART
    // =========================
    const chartData = [];

    for (let r = 11; r <= 14; r++) {
      chartData.push({
        name: infoData[r]?.[73] || '',
        value: getNum(r, 74)
      });
    }

    // =========================
    // SUMMARY TABLE
    // =========================
    const summaryTableData = [];

    for (let r = 11; r <= 15; r++) {
      summaryTableData.push({
        col1: infoData[r]?.[73] || '',
        col2: infoData[r]?.[74] || ''
      });
    }

    // =========================
    // SECOND CHART
    // =========================
    const secondChartData = [];

    for (let r = 1; r <= 8; r++) {
      secondChartData.push({
        name: infoData[r]?.[73] || '',
        value: getNum(r, 74)
      });
    }

    // =========================
    // SECOND TABLE
    // =========================
    const secondTableData = [];

    for (let r = 1; r <= 9; r++) {
      secondTableData.push({
        col1: infoData[r]?.[73] || '',
        col2: infoData[r]?.[74] || ''
      });
    }

    // =========================
    // TABLE ใหญ่ด้านล่าง
    // ใช้ Dashboard W10 All
    // =========================
    const purchaseList = [];

    for (let r = 12; r < rawData.length; r++) {

      const row = rawData[r] || [];

      // เช็คว่ามีข้อมูล
      if (
        row[6] ||
        row[7] ||
        row[8]
      ) {

        purchaseList.push({

          ecm_buy: row[6] || '',
          ecm: row[7] || '',
          wo: row[8] || '',
          item: row[9] || '',
          equip: row[10] || '',
          date_in: row[11] || '',
          date_start: row[12] || '',
          date_out: row[13] || '',
          status: row[14] || '',
          action: row[15] || ''

        });

      }
    }

    return NextResponse.json({

      gauges,
      chartData,
      summaryTableData,
      secondChartData,
      secondTableData,
      purchaseList,
      currentYear,
      currentMonth

    });

  } catch (error: any) {

    console.error(
      'Purchasing API Error:',
      error
    );

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}