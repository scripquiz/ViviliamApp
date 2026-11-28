import { NgModule } from '@angular/core';

import { ReadPageRoutingModule } from './read-routing.module';

import { ReadPage } from './read.page';

@NgModule({
  imports: [ReadPageRoutingModule, ReadPage],
})
export class ReadPageModule {}
