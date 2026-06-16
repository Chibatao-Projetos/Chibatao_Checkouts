import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacoes/notificacoes.service';
import { AuthUser } from '../common/decorators';
import { endOfDay, parseNaive, startOfDay, toInstant, toNaive } from '../common/dates';
import { CriarSolicitacaoDto } from './dto';

const STATUS = ['AguardandoGestor', 'AguardandoRH', 'LiberadoPortaria', 'EmTransito', 'Concluido', 'Reprovado'];
const TIPOS = ['Particular', 'AServico'];

export interface ListarParams {
  page?: string;
  pageSize?: string;
  status?: string;
  setor?: string;
  tipoSaida?: string;
  dataInicio?: string;
  dataFim?: string;
  sortBy?: string;
  sortDesc?: string;
  incluirHistorico?: string;
  somenteExtraordinarias?: string;
  minhas?: string;
  nome?: string;
  destino?: string;
}

const bool = (v?: string) => v === 'true' || v === '1';

@Injectable()
export class SolicitacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoes: NotificacaoService,
  ) {}

  private async nomes(ids: Array<number | null | undefined>): Promise<Map<number, string>> {
    const unique = [...new Set(ids.filter((x): x is number => !!x))];
    if (unique.length === 0) return new Map();
    const users = await this.prisma.usuarios.findMany({
      where: { Id: { in: unique } },
      select: { Id: true, Nome: true },
    });
    return new Map(users.map((u) => [u.Id, u.Nome]));
  }

  private map(s: any, nomes: Map<number, string>) {
    return {
      id: s.Id,
      nome: s.Nome,
      setor: s.Setor,
      destino: s.Destino,
      unidadeDestino: s.UnidadeDestino ?? undefined,
      setorDestino: s.SetorDestino ?? undefined,
      tipoSaida: s.TipoSaida,
      previsaoRetorno: s.PrevisaoRetorno,
      dataPrevistaRetorno: toNaive(s.DataPrevistaRetorno),
      horarioPrevistodoRetorno: s.HorarioPrevistodoRetorno ?? undefined,
      isExtraordinaria: s.IsExtraordinaria,
      dataSaida: toNaive(s.DataSaida),
      dataSolicitacao: toInstant(s.DataSolicitacao),
      status: s.Status,
      motivoReprovacao: s.MotivoReprovacao ?? undefined,
      nomeVigilante: s.NomeVigilante ?? undefined,
      horaSaida: toInstant(s.HoraSaida),
      horaRetorno: toInstant(s.HoraRetorno),
      nomeSolicitante: nomes.get(s.SolicitanteId) ?? '',
      dataAprovacaoGestor: toInstant(s.DataAprovacaoGestor),
      nomeAprovadorGestor: s.GestorAprovadorId ? nomes.get(s.GestorAprovadorId) : undefined,
      dataAprovacaoRH: toInstant(s.DataAprovacaoRH),
      nomeAprovadorRH: s.RHAprovadorId ? nomes.get(s.RHAprovadorId) : undefined,
    };
  }

  async listar(user: AuthUser, q: ListarParams) {
    const page = Math.max(Number(q.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(q.pageSize) || 10, 1), 200);
    const where: Prisma.SolicitacoesWhereInput = {};

    if (bool(q.minhas)) {
      where.SolicitanteId = user.userId;
    } else {
      switch (user.role) {
        case 'Solicitante':
          where.SolicitanteId = user.userId;
          break;
        case 'Gestor':
          where.Setor = { equals: user.setor, mode: 'insensitive' };
          break;
        case 'Portaria':
          where.Status = bool(q.incluirHistorico)
            ? 'Concluido'
            : { in: ['LiberadoPortaria', 'EmTransito'] };
          break;
        // RH e Admin veem tudo
      }
    }

    if (bool(q.somenteExtraordinarias)) where.IsExtraordinaria = true;
    if (q.status && STATUS.includes(q.status)) where.Status = q.status;
    if (q.setor) where.Setor = { contains: q.setor };
    if (q.tipoSaida && TIPOS.includes(q.tipoSaida)) where.TipoSaida = q.tipoSaida;
    if (q.nome) where.Nome = { contains: q.nome };
    if (q.dataInicio || q.dataFim) {
      where.DataSolicitacao = {};
      if (q.dataInicio) (where.DataSolicitacao as any).gte = startOfDay(q.dataInicio);
      if (q.dataFim) (where.DataSolicitacao as any).lte = endOfDay(q.dataFim);
    }
    if (q.destino) {
      where.OR = [
        { Destino: { contains: q.destino } },
        { UnidadeDestino: { contains: q.destino } },
        { SetorDestino: { contains: q.destino } },
      ];
    }

    const sortField =
      q.sortBy === 'nome' ? 'Nome'
      : q.sortBy === 'setor' ? 'Setor'
      : q.sortBy === 'status' ? 'Status'
      : 'DataSolicitacao';
    const orderBy: Prisma.SolicitacoesOrderByWithRelationInput = {
      [sortField]: bool(q.sortDesc) ? 'desc' : 'asc',
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.solicitacoes.count({ where }),
      this.prisma.solicitacoes.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const nomes = await this.nomes(
      rows.flatMap((s) => [s.SolicitanteId, s.GestorAprovadorId, s.RHAprovadorId]),
    );
    return { data: rows.map((s) => this.map(s, nomes)), total, page, pageSize };
  }

  async obterPorId(id: number) {
    const s = await this.prisma.solicitacoes.findUnique({ where: { Id: id } });
    if (!s) throw new NotFoundException();
    const nomes = await this.nomes([s.SolicitanteId, s.GestorAprovadorId, s.RHAprovadorId]);
    return this.map(s, nomes);
  }

  async criar(user: AuthUser, dto: CriarSolicitacaoDto) {
    const initialStatus = dto.isExtraordinaria ? 'AguardandoRH' : 'AguardandoGestor';
    const s = await this.prisma.solicitacoes.create({
      data: {
        Nome: dto.nome,
        Setor: dto.setor,
        Destino: dto.destino,
        UnidadeDestino: dto.unidadeDestino ?? null,
        SetorDestino: dto.setorDestino ?? null,
        TipoSaida: dto.tipoSaida,
        PrevisaoRetorno: dto.previsaoRetorno,
        DataPrevistaRetorno: dto.dataPrevistaRetorno ? parseNaive(dto.dataPrevistaRetorno) : null,
        HorarioPrevistodoRetorno: dto.horarioPrevistodoRetorno ?? null,
        IsExtraordinaria: dto.isExtraordinaria,
        DataSaida: parseNaive(dto.dataSaida),
        DataSolicitacao: new Date(),
        Status: initialStatus,
        SolicitanteId: user.userId,
      },
    });
    await this.notificacoes.notificarNovaSolicitacao(s);
    return this.obterPorId(s.Id);
  }

  async excluir(user: AuthUser, id: number) {
    const s = await this.prisma.solicitacoes.findUnique({ where: { Id: id } });
    if (!s) throw new NotFoundException();
    if (user.role !== 'Admin' && s.SolicitanteId !== user.userId) throw new ForbiddenException();

    const pendente =
      (s.Status === 'AguardandoGestor' || s.Status === 'AguardandoRH') &&
      s.GestorAprovadorId == null &&
      s.RHAprovadorId == null;
    if (!pendente) {
      throw new BadRequestException({ message: 'Só é possível excluir solicitações que ainda não foram aprovadas.' });
    }

    await this.prisma.solicitacoes.delete({ where: { Id: id } });
    return { message: 'Solicitação excluída com sucesso.' };
  }

  async aprovarGestor(user: AuthUser, id: number) {
    const s = await this.requireStatus(id, 'AguardandoGestor', 'Solicitação não está aguardando aprovação do Gestor.');
    const updated = await this.prisma.solicitacoes.update({
      where: { Id: id },
      data: { Status: 'AguardandoRH', GestorAprovadorId: user.userId, DataAprovacaoGestor: new Date() },
    });
    await this.notificacoes.notificarAprovacaoGestor(updated);
    void s;
    return { message: 'Aprovado pelo Gestor.' };
  }

  async reprovarGestor(user: AuthUser, id: number, motivo: string) {
    if (!motivo?.trim()) throw new BadRequestException({ message: 'O motivo da reprovação é obrigatório.' });
    await this.requireStatus(id, 'AguardandoGestor', 'Solicitação não está aguardando aprovação do Gestor.');
    const updated = await this.prisma.solicitacoes.update({
      where: { Id: id },
      data: { Status: 'Reprovado', MotivoReprovacao: motivo, GestorAprovadorId: user.userId, DataAprovacaoGestor: new Date() },
    });
    await this.notificacoes.notificarReprovacao(updated, 'gestor', motivo);
    return { message: 'Solicitação reprovada pelo Gestor.' };
  }

  async aprovarRH(user: AuthUser, id: number) {
    await this.requireStatus(id, 'AguardandoRH', 'Solicitação não está aguardando aprovação do RH.');
    const updated = await this.prisma.solicitacoes.update({
      where: { Id: id },
      data: { Status: 'LiberadoPortaria', RHAprovadorId: user.userId, DataAprovacaoRH: new Date() },
    });
    await this.notificacoes.notificarAprovacaoRH(updated);
    return { message: 'Aprovado pelo RH.' };
  }

  async reprovarRH(user: AuthUser, id: number, motivo: string) {
    if (!motivo?.trim()) throw new BadRequestException({ message: 'O motivo da reprovação é obrigatório.' });
    await this.requireStatus(id, 'AguardandoRH', 'Solicitação não está aguardando aprovação do RH.');
    const updated = await this.prisma.solicitacoes.update({
      where: { Id: id },
      data: { Status: 'Reprovado', MotivoReprovacao: motivo, RHAprovadorId: user.userId, DataAprovacaoRH: new Date() },
    });
    await this.notificacoes.notificarReprovacao(updated, 'RH', motivo);
    return { message: 'Solicitação reprovada pelo RH.' };
  }

  async registrarSaida(id: number, nomeVigilante: string) {
    const s = await this.requireStatus(id, 'LiberadoPortaria', 'Solicitação não está liberada para saída.');
    const novoStatus = s.PrevisaoRetorno ? 'EmTransito' : 'Concluido';
    await this.prisma.solicitacoes.update({
      where: { Id: id },
      data: { NomeVigilante: nomeVigilante, HoraSaida: new Date(), Status: novoStatus },
    });
    return { message: 'Saída registrada.', status: novoStatus };
  }

  async registrarRetorno(id: number) {
    await this.requireStatus(id, 'EmTransito', 'Solicitação não está em trânsito.');
    await this.prisma.solicitacoes.update({
      where: { Id: id },
      data: { HoraRetorno: new Date(), Status: 'Concluido' },
    });
    return { message: 'Retorno registrado.' };
  }

  private async requireStatus(id: number, status: string, msg: string) {
    const s = await this.prisma.solicitacoes.findUnique({ where: { Id: id } });
    if (!s) throw new NotFoundException();
    if (s.Status !== status) throw new BadRequestException({ message: msg });
    return s;
  }
}
