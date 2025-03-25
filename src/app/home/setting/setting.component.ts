import { Component, OnInit } from '@angular/core';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';

import { ElectronService } from '../../core/services';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
})
export class SettingComponent implements OnInit {
  path = '';

  constructor(
    public activeOffcanvas: NgbActiveOffcanvas,
    private electronService: ElectronService
  ) {}

  async ngOnInit(): Promise<void> {
    this.path = await this.electronService.getStoreValue('path', '');
  }

  async openDialog() {
    const win = this.electronService.remote.getCurrentWindow();
    const result = await this.electronService.remote.dialog.showOpenDialog(
      win,
      {
        properties: ['openDirectory'],
      }
    );
    if (result.filePaths.length) {
      this.path = result.filePaths[0];
    }
  }

  async save() {
    await this.electronService.setStoreValue('path', this.path);
    this.activeOffcanvas.close(true);
  }
}
