import { Injectable, TemplateRef } from '@angular/core';

export interface Toast<T> {
  text?: string;
  template?: TemplateRef<T>;
  className?: string;
  delay?: number;
  autoHide?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService<T = any> {
  toasts: Toast<T>[] = [];

  show(
    textOrTpl: string | TemplateRef<T>,
    options: { className?: string; delay?: number; autoHide?: boolean } = {}
  ) {
    if (textOrTpl instanceof TemplateRef) {
      this.toasts.push({ template: textOrTpl, ...options });
    } else {
      this.toasts.push({ text: textOrTpl, ...options });
    }
  }

  showStandard(text: string) {
    this.show(text, { className: 'bg-primary text-light' });
  }

  showSuccess(text: string) {
    this.show(text, { className: 'bg-success text-light' });
  }

  showDanger(text: string) {
    this.show(text, { className: 'bg-danger text-light' });
  }

  remove(toast: Toast<T>) {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }

  clear() {
    this.toasts.splice(0, this.toasts.length);
  }
}
