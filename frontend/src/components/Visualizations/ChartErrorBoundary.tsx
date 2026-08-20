import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { TableData } from '../../types';
import { DataTable } from './DataTable';

interface Props {
  children: ReactNode;
  fallbackData?: TableData;
}

interface State {
  hasError: boolean;
}

export class ChartErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Visualization failed to render — fall back to a plain table below.
    void error;
    void info;
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackData) {
        return (
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Couldn't render the chart, showing the data instead.
            </p>
            <DataTable data={this.props.fallbackData} />
          </div>
        );
      }
      return (
        <p className="text-xs text-danger">
          Couldn't render the visualization for this result.
        </p>
      );
    }

    return this.props.children;
  }
}
