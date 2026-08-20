import { Bar } from 'react-chartjs-2';
import type { Visualization } from '../../types';
import { CHART_COLORS } from './chartSetup';

interface BarChartProps {
  visualization: Visualization;
}

export function BarChart({ visualization }: BarChartProps) {
  const { labels, values, x_label, y_label } = visualization;

  const data = {
    labels,
    datasets: [
      {
        label: y_label ?? 'Value',
        data: values,
        backgroundColor: CHART_COLORS.tealStart,
        hoverBackgroundColor: CHART_COLORS.tealEnd,
        borderRadius: 8,
        maxBarThickness: 42,
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
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1F2433',
        borderColor: CHART_COLORS.tealStart,
        borderWidth: 1,
        padding: 10,
        titleColor: '#E2E8F0',
        bodyColor: '#E2E8F0',
        displayColors: false,
      },
    },
    scales: {
      x: {
        title: x_label
          ? { display: true, text: x_label, color: CHART_COLORS.text }
          : undefined,
        grid: { display: false },
        ticks: { color: CHART_COLORS.text },
      },
      y: {
        title: y_label
          ? { display: true, text: y_label, color: CHART_COLORS.text }
          : undefined,
        grid: { color: CHART_COLORS.gridLine },
        ticks: { color: CHART_COLORS.text },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
