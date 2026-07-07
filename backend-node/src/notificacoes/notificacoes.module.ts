import { Module } from '@nestjs/common';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacaoService } from './notificacoes.service';
import { MailService } from './mail.service';

@Module({
  controllers: [NotificacoesController],
  providers: [NotificacaoService, MailService],
  exports: [NotificacaoService],
})
export class NotificacoesModule {}
