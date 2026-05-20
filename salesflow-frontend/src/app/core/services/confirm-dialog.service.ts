import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface DialogState {
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<DialogState | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      this.state.set({ options, resolve });
    });
  }

  answer(confirmed: boolean) {
    const current = this.state();
    if (current) {
      current.resolve(confirmed);
      this.state.set(null);
    }
  }
}
