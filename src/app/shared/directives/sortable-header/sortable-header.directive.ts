import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
} from '@angular/core';

export type SortColumn<T> = keyof T | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = {
  asc: 'desc',
  desc: '',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '': 'asc',
};

export const compare = (v1: string | number, v2: string | number) =>
  v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

export interface SortEvent<T> {
  column: SortColumn<T>;
  direction: SortDirection;
}

@Directive({
  selector: 'th[sortable]',
})
export class SortableHeaderDirective<T = any> {
  @Input() sortable: SortColumn<T> = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent<T>>();
  @HostBinding('class') get class(): string {
    return this.direction === 'asc'
      ? 'sortable-header asc'
      : this.direction === 'desc'
      ? 'sortable-header desc'
      : 'sortable-header';
  }

  @HostListener('click') onClick() {
    this.rotate();
  }

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}
