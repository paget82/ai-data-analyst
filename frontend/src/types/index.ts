export type MessageRole = 'user' | 'ai';

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export type VisualizationType = 'bar' | 'line' | 'pie';

export interface Visualization {
  type: VisualizationType;
  x_label?: string;
  y_label?: string;
  labels: string[];
  values: number[];
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  data?: TableData;
  visualization?: Visualization;
  sql?: string;
  timestamp: number;
  isError?: boolean;
  isPending?: boolean;
}

export interface ApiRequest {
  message: string;
  session_id: string;
}

export interface ApiResponse {
  response: string;
  data?: TableData;
  visualization?: Visualization;
  sql_executed?: string;
}

export type HistoryItemType = 'chart' | 'table' | 'text';

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  type: HistoryItemType;
  userMessageId: string;
  aiMessageId: string;
}

export interface ChatSnapshot {
  userMessage: Message;
  aiMessage: Message;
}
