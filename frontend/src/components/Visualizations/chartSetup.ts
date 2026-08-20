import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

export const CHART_COLORS = {
  tealStart: '#00E0C6',
  tealEnd: '#00BFA5',
  purple: '#8854D0',
  purpleAlt: '#7D5FFF',
  danger: '#FF4757',
  success: '#2ECC71',
  gridLine: 'rgba(255, 255, 255, 0.06)',
  text: '#94A3B8',
};

export const PIE_PALETTE = [
  '#00E0C6',
  '#8854D0',
  '#7D5FFF',
  '#2ECC71',
  '#FF4757',
  '#00BFA5',
  '#FFB84C',
  '#4C9FFF',
];

export function makeTealGradient(ctx: CanvasRenderingContext2D, area: { top: number; bottom: number }) {
  const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
  gradient.addColorStop(0, 'rgba(0, 224, 198, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 224, 198, 0)');
  return gradient;
}
