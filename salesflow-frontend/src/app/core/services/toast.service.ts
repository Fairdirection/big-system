import { Injectable, signal } from '@angular/core';

export interface ToastAction {
  label: string;
  callback: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
  action?: ToastAction;
  undoCallback?: () => void;
  onClose?: () => void;
  timer?: any;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration = 4000,
    action?: ToastAction,
    onClose?: () => void
  ) {
    const id = Math.random().toString(36).substring(2, 9);
    
    const timer = setTimeout(() => {
      this.remove(id);
      if (onClose) onClose();
    }, duration);

    const toast: Toast = {
      id,
      message,
      type,
      duration,
      action,
      onClose,
      timer
    };

    this.toasts.set([...this.toasts(), toast]);
    return id;
  }

  showSuccess(message: string, duration = 4000, action?: ToastAction) {
    return this.show(message, 'success', duration, action);
  }

  showError(message: string, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  showInfo(message: string, duration = 4000) {
    return this.show(message, 'info', duration);
  }

  showWarning(message: string, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Triggers an interactive toast that schedules a commit action after 5 seconds,
   * but allows the user to immediately cancel (Undo) the operation.
   */
  showWithUndo(
    message: string,
    undoCallback: () => void,
    commitCallback: () => void,
    duration = 5000
  ) {
    const id = Math.random().toString(36).substring(2, 9);
    let undone = false;

    const timer = setTimeout(() => {
      this.remove(id);
      if (!undone) {
        commitCallback();
      }
    }, duration);

    const toast: Toast = {
      id,
      message,
      type: 'success',
      duration,
      action: {
        label: 'تراجع',
        callback: () => {
          undone = true;
          clearTimeout(timer);
          this.remove(id);
          undoCallback();
        }
      },
      timer
    };

    this.toasts.set([...this.toasts(), toast]);
    return id;
  }

  remove(id: string) {
    const active = this.toasts().find(t => t.id === id);
    if (active && active.timer) {
      clearTimeout(active.timer);
    }
    this.toasts.set(this.toasts().filter(t => t.id !== id));
  }
}
