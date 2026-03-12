import { Module } from '@nestjs/common';
import { ViewsService } from './views.service';
import { ViewsController } from './views.controller';
import { ConnectionModule } from '../connection/connection.module';

@Module({
  imports: [ConnectionModule],
  providers: [ViewsService],
  controllers: [ViewsController],
  exports: [ViewsService],
})
export class ViewsModule {}
