import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts-container',
  standalone: true,
  imports: [NgbToastModule, CommonModule],
  templateUrl: './toasts-container.component.html',
})
export class ToastsContainerComponent<T = any> {
  constructor(public toastService: ToastService<T>) {}

  @HostBinding('class') class = 'toast-container position-fixed bottom-0 end-0 p-3';
  @HostBinding('style') style = 'z-index: 1200';
}
