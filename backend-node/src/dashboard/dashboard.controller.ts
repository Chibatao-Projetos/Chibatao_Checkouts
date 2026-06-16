import { Controller, Get } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, CurrentUser } from '../common/decorators';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getStats(@CurrentUser() user: AuthUser) {
    const base: Prisma.SolicitacoesWhereInput = {};
    if (user.role === 'Solicitante') base.SolicitanteId = user.userId;
    else if (user.role === 'Gestor') base.Setor = { equals: user.setor, mode: 'insensitive' };

    const countWhere = (extra: Prisma.SolicitacoesWhereInput) =>
      this.prisma.solicitacoes.count({ where: { ...base, ...extra } });

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const [
      total, aguardandoGestor, aguardandoRH, liberadoPortaria, emTransito,
      concluido, reprovado, extraordinarias, hoje, usuariosPendentes,
    ] = await Promise.all([
      this.prisma.solicitacoes.count({ where: base }),
      countWhere({ Status: 'AguardandoGestor' }),
      countWhere({ Status: 'AguardandoRH' }),
      countWhere({ Status: 'LiberadoPortaria' }),
      countWhere({ Status: 'EmTransito' }),
      countWhere({ Status: 'Concluido' }),
      countWhere({ Status: 'Reprovado' }),
      countWhere({ IsExtraordinaria: true }),
      countWhere({ DataSolicitacao: { gte: today } }),
      user.role === 'Admin'
        ? this.prisma.usuarios.count({ where: { Status: 'Pendente' } })
        : Promise.resolve(0),
    ]);

    return {
      total, aguardandoGestor, aguardandoRH, liberadoPortaria, emTransito,
      concluido, reprovado, extraordinarias, hoje, usuariosPendentes,
    };
  }
}
