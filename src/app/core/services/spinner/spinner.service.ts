import {
  ApplicationRef,
  ComponentRef,
  Injectable,
  ViewContainerRef,
} from '@angular/core';

import { SpinnerComponent } from './spinner.component';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  spinner!: ComponentRef<SpinnerComponent>;
  loading = false;
  private readonly viewContainerRef: ViewContainerRef;

  constructor(private appRef: ApplicationRef) {
    this.viewContainerRef =
      this.appRef.components[0].injector.get(ViewContainerRef);
  }

  show() {
    if (!this.loading) {
      this.spinner = this.viewContainerRef.createComponent(SpinnerComponent);
      this.loading = true;
    }
  }

  hide() {
    if (this.loading) {
      this.spinner.destroy();
      this.loading = false;
    }
  }
}
