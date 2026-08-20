import { Line } from 'react-chartjs-2';
import type { ChartData, ScriptableContext } from 'chart.js';
import type { Visualization } from '../../types';
import { CHART_COLORS, makeTealGradient } from './chartSetup';

interface LineChartProps {
  visualization: Visualization;
}

export function LineChart({ visualization }: LineChartProps) {
  const { labels, values, x_label, y_label } = visualization;

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: y_label ?? 'Value',
        data: values,
        borderColor: CHART_COLORS.tealStart,
        pointBackgroundColor: CHART_COLORS.tealStart,
        pointBorderColor: '#0B0E14',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'rgba(0, 224, 198, 0.15)';
          return makeTealGradient(ctx, { top: chartArea.top, bottom: chartArea.bottom });
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
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
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Line data={data} options={options} />
    </div>
  );
}
