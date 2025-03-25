import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SettingComponent } from './setting.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [SettingComponent],
  imports: [CommonModule, SharedModule],
  exports: [SettingComponent],
})
export class SettingModule {}
