import { BarChart3, MessageSquare, Table2 } from 'lucide-react';
import type { HistoryItemType } from '../../types';

export function HistoryItemIcon({ type }: { type: HistoryItemType }) {
  const iconProps = { size: 14 };

  switch (type) {
    case 'chart':
      return <BarChart3 {...iconProps} className="text-teal-start" />;
    case 'table':
      return <Table2 {...iconProps} className="text-aiPurple-alt" />;
    default:
      return <MessageSquare {...iconProps} className="text-slate-400" />;
  }
}
