import { Pie } from 'react-chartjs-2';
import type { Visualization } from '../../types';
import { PIE_PALETTE } from './chartSetup';

interface PieChartProps {
  visualization: Visualization;
}

export function PieChart({ visualization }: PieChartProps) {
  const { labels, values } = visualization;
  const total = values.reduce((sum, v) => sum + v, 0);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: PIE_PALETTE.slice(0, values.length),
        borderColor: '#151923',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 700,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#94A3B8',
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#1F2433',
        borderColor: '#8854D0',
        borderWidth: 1,
        padding: 10,
        titleColor: '#E2E8F0',
        bodyColor: '#E2E8F0',
        displayColors: true,
        callbacks: {
          label: (ctx: { label?: string; raw: unknown }) => {
            const value = Number(ctx.raw);
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${ctx.label}: ${value} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Pie data={data} options={options} />
    </div>
  );
}
