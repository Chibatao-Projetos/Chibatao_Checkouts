import { Module } from '@nestjs/common';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacaoService } from './notificacoes.service';

@Module({
  controllers: [NotificacoesController],
  providers: [NotificacaoService],
  exports: [NotificacaoService],
})
export class NotificacoesModule {}
