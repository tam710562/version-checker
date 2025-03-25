import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { ElectronService } from '../../../core/services';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  win: Electron.CrossProcessExports.BrowserWindow;
  isMaximized = false;

  constructor(
    private electronService: ElectronService,
    private cdr: ChangeDetectorRef
  ) {
    /* Note this is different to the html global `window` variable */
    this.win = this.electronService.remote.getCurrentWindow();
  }

  ngOnInit(): void {
    // Toggle maximize/restore buttons when maximization/unmaximization occurs
    this.toggleMaxRestoreButtons();
    this.win.on('maximize', () => this.toggleMaxRestoreButtons());
    this.win.on('unmaximize', () => this.toggleMaxRestoreButtons());
  }

  toggleMaxRestoreButtons() {
    if (this.win.isMaximized()) {
      this.isMaximized = true;
    } else {
      this.isMaximized = false;
    }
    this.cdr.detectChanges();
  }

  onClickMin() {
    this.win.minimize();
  }

  onClickMax() {
    this.win.maximize();
  }

  onClickRestore() {
    this.win.unmaximize();
  }

  onClickClose() {
    this.win.close();
  }
}
