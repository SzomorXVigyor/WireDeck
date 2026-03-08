import { Module } from '@nestjs/common';
import { ViewsService } from './views.service';
import { ViewsController } from './views.controller';

@Module({
  providers: [ViewsService],
  controllers: [ViewsController],
  exports: [ViewsService],
})
export class ViewsModule {}
