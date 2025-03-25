import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import {
  HeaderComponent,
  IconComponent,
  PageNotFoundComponent,
} from './components';
import {
  NgVarDirective,
  SortableHeaderDirective,
  WebviewDirective,
} from './directives/';
import { IsNewerVersionPipe } from './pipes';

@NgModule({
  declarations: [
    IconComponent,
    PageNotFoundComponent,
    HeaderComponent,
    WebviewDirective,
    NgVarDirective,
    SortableHeaderDirective,
    IsNewerVersionPipe,
  ],
  imports: [CommonModule, TranslateModule, FormsModule],
  exports: [
    IconComponent,
    PageNotFoundComponent,
    HeaderComponent,
    TranslateModule,
    WebviewDirective,
    NgVarDirective,
    SortableHeaderDirective,
    IsNewerVersionPipe,
  ],
})
export class SharedModule {}
