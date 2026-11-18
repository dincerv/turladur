'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PIE_COLORS = ['#2563eb', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444'];

type RevenueTrendChartProps = {
  data: Array<{ label: string; revenue: number; sales: number }>;
};

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  return (
    <div
      className="h-72 w-full rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      data-testid="reports-revenue-chart"
    >
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Ciro trendi</h3>
      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">Veri yok</p>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) =>
                `${Number(value).toLocaleString('tr-TR')} ₺`
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              fill="url(#revenueFill)"
              strokeWidth={2}
              name="Ciro"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

type OccupancyChartProps = {
  data: Array<{ name: string; occupancyRate: number }>;
};

export function OccupancyBarChart({ data }: OccupancyChartProps) {
  const truncated = data.map((d) => ({
    ...d,
    shortName: d.name.length > 18 ? `${d.name.slice(0, 16)}…` : d.name,
  }));

  return (
    <div
      className="h-72 w-full rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      data-testid="reports-occupancy-chart"
    >
      <h3 className="mb-3 text-sm font-semibold text-gray-900">
        Tur doluluk oranları
      </h3>
      {truncated.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">Veri yok</p>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={truncated}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="shortName" tick={{ fontSize: 10 }} interval={0} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip
              formatter={(value) => `${Number(value).toFixed(1)}%`}
              labelFormatter={(_, payload) =>
                String(payload?.[0]?.payload?.name ?? '')
              }
            />
            <Bar
              dataKey="occupancyRate"
              fill="#0ea5e9"
              name="Doluluk"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

type SatisfactionPieProps = {
  data: Array<{ rating: number; percentage: number }>;
};

export function SatisfactionPieChart({ data }: SatisfactionPieProps) {
  const chartData = data
    .filter((d) => d.percentage > 0)
    .map((d) => ({
      name: `${d.rating}★`,
      value: d.percentage,
    }));

  return (
    <div
      className="h-72 w-full rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      data-testid="reports-satisfaction-chart"
    >
      <h3 className="mb-3 text-sm font-semibold text-gray-900">
        Memnuniyet dağılımı
      </h3>
      {chartData.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">Veri yok</p>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name} ${value}%`}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${Number(value)}%`} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
