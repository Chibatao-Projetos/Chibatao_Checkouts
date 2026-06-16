import { Controller, Get, NotFoundException, Param, ParseIntPipe, Put, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, CurrentUser } from '../common/decorators';
import { toInstant } from '../common/dates';

@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listar(@CurrentUser() user: AuthUser, @Query('limit') limit?: string) {
    const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const lista = await this.prisma.notificacoes.findMany({
      where: { UsuarioId: user.userId },
      orderBy: { DataCriacao: 'desc' },
      take,
    });
    return lista.map((n) => ({
      id: n.Id,
      mensagem: n.Mensagem,
      tipo: n.Tipo,
      lida: n.Lida,
      dataCriacao: toInstant(n.DataCriacao),
      solicitacaoId: n.SolicitacaoId ?? undefined,
    }));
  }

  @Get('nao-lidas')
  async contarNaoLidas(@CurrentUser() user: AuthUser) {
    const count = await this.prisma.notificacoes.count({
      where: { UsuarioId: user.userId, Lida: false },
    });
    return { count };
  }

  @Put(':id/lida')
  async marcarLida(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    const n = await this.prisma.notificacoes.findFirst({ where: { Id: id, UsuarioId: user.userId } });
    if (!n) throw new NotFoundException();
    await this.prisma.notificacoes.update({ where: { Id: id }, data: { Lida: true } });
    return {};
  }

  @Put('marcar-todas-lidas')
  async marcarTodasLidas(@CurrentUser() user: AuthUser) {
    const r = await this.prisma.notificacoes.updateMany({
      where: { UsuarioId: user.userId, Lida: false },
      data: { Lida: true },
    });
    return { atualizadas: r.count };
  }
}
