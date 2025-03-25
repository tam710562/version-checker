import { Component, Input } from '@angular/core';
import * as mdi from '@mdi/js';

interface MdiType {
  [key: string]: string
}

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss']
})
export class IconComponent {
  public data = '';
  private iconName = '';

  @Input()
  get path(): string {
    return this.iconName;
  }
  set path(value: string) {
    if (value) {
      this.data = (mdi as MdiType)[value];
    }
    this.iconName = value;
  }
}
