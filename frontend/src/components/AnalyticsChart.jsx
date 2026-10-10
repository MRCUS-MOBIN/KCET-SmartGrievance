import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6c63ff','#22c55e','#f59e0b','#ef4444','#3b82f6','#a855f7','#06b6d4','#f97316','#84cc16','#ec4899'];

const TT_STYLE = {
  background: '#1a1e30', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, color: '#e8eaf0', fontSize: 13,
};

export function BarChartWidget({ data, xKey, yKey, label, color = '#6c63ff' }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 60 }}>
        <XAxis dataKey={xKey} tick={{ fill: '#5c6480', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tick={{ fill: '#5c6480', fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={TT_STYLE} />
        <Bar dataKey={yKey} name={label} fill={color} radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieChartWidget({ data, nameKey, valueKey }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={TT_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#9ba3bc' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function LineChartWidget({ data, xKey, yKey, label, color = '#6c63ff' }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <XAxis dataKey={xKey} tick={{ fill: '#5c6480', fontSize: 11 }} />
        <YAxis tick={{ fill: '#5c6480', fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={TT_STYLE} />
        <Line type="monotone" dataKey={yKey} name={label} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
