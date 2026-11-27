import { Injectable, signal } from '@angular/core';

export type ConfirmResult = 'primary' | 'secondary' | 'cancel';

export interface ConfirmOptions {
  message: string;
  primaryLabel: string;
  secondaryLabel: string;
  title?: string;
  closeLabel?: string;
}

type Pending = ConfirmOptions & {
  resolve: (value: ConfirmResult) => void;
};

/**
 * 应用内确认编排；同一时间只挂一个，新请求会取消未完成的。
 * 与 `EditorPage` 同生命周期（providers）。
 */
@Injectable()
export class ConfirmDialogService {
  readonly request = signal<ConfirmOptions | null>(null);
  private pending: Pending | null = null;

  confirm(options: ConfirmOptions): Promise<ConfirmResult> {
    this.pending?.resolve('cancel');
    return new Promise((resolve) => {
      this.pending = { ...options, resolve };
      this.request.set(options);
    });
  }

  finish(value: ConfirmResult): void {
    const pending = this.pending;
    this.pending = null;
    this.request.set(null);
    pending?.resolve(value);
  }
}
