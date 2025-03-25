import { Pipe, PipeTransform } from '@angular/core';
import { isNewerVersion } from '../common';

@Pipe({
  name: 'isNewerVersion',
})
export class IsNewerVersionPipe implements PipeTransform {
  transform(oldVer: string, newVer: string): boolean {
    return isNewerVersion(oldVer, newVer);
  }
}
