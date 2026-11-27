import { Injectable, signal } from '@angular/core';

export type AppToastKind = 'error' | 'warning' | 'success' | 'info';

export interface AppToastAction {
  label: string;
  run: () => void;
}

export interface AppToastItem {
  id: string;
  kind: AppToastKind;
  title: string;
  description: string | undefined;
  action: AppToastAction | undefined;
}

export interface AppToastOptions {
  description?: string;
  durationMs?: number;
  action?: AppToastAction;
}

const DEFAULT_DISMISS_MS = 4000;

/**
 * 应用内 toast：顶栏文字提示。
 * 宿主为 `AppToastHost`（挂在 `app-root`）。
 */
@Injectable({ providedIn: 'root' })
export class AppToast {
  readonly items = signal<AppToastItem[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  error(title: string, description?: string): void {
    this.push('error', title, { description });
  }

  warning(message: string): void {
    this.push('warning', message);
  }

  success(title: string, options?: AppToastOptions): void {
    this.push('success', title, options);
  }

  info(title: string, options?: AppToastOptions): void {
    this.push('info', title, options);
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.items.update((list) => list.filter((item) => item.id !== id));
  }

  private push(kind: AppToastKind, title: string, options?: AppToastOptions): void {
    const id = crypto.randomUUID();
    this.items.update((list) => [
      ...list,
      {
        id,
        kind,
        title,
        description: options?.description,
        action: options?.action,
      },
    ]);
    const duration = options?.durationMs ?? DEFAULT_DISMISS_MS;
    this.timers.set(
      id,
      setTimeout(() => {
        this.dismiss(id);
      }, duration),
    );
  }
}
