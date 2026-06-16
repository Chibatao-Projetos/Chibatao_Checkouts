import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type SolicitacaoLike = {
  Id: number;
  Nome: string;
  Setor: string;
  SolicitanteId: number;
  IsExtraordinaria: boolean;
};

/**
 * Ponto único de criação de notificações internas.
 * Extensão futura (e-mail): disparar dentro de `criar`.
 */
@Injectable()
export class NotificacaoService {
  constructor(private readonly prisma: PrismaService) {}

  private async criar(usuarioIds: number[], mensagem: string, tipo: string, solicitacaoId: number | null) {
    if (usuarioIds.length === 0) return;
    await this.prisma.notificacoes.createMany({
      data: usuarioIds.map((UsuarioId) => ({
        UsuarioId,
        Mensagem: mensagem,
        Tipo: tipo,
        SolicitacaoId: solicitacaoId,
        DataCriacao: new Date(),
        Lida: false,
      })),
    });
    // TODO (etapa e-mail): enviar e-mail aos destinatários aqui.
  }

  private async adminIds(): Promise<number[]> {
    const r = await this.prisma.usuarios.findMany({
      where: { Perfil: 'Admin', Status: 'Ativo' },
      select: { Id: true },
    });
    return r.map((u) => u.Id);
  }

  private async rhIds(): Promise<number[]> {
    const r = await this.prisma.usuarios.findMany({
      where: { Perfil: 'RH', Status: 'Ativo' },
      select: { Id: true },
    });
    return r.map((u) => u.Id);
  }

  private async gestoresDoSetor(setor: string): Promise<number[]> {
    const r = await this.prisma.usuarios.findMany({
      where: { Perfil: 'Gestor', Status: 'Ativo', Setor: { equals: setor, mode: 'insensitive' } },
      select: { Id: true },
    });
    return r.map((u) => u.Id);
  }

  /** Nova solicitação → gestores do setor (ou RH, se extraordinária) + admins. */
  async notificarNovaSolicitacao(s: SolicitacaoLike) {
    const dest = new Set<number>(await this.adminIds());
    const aprovadores = s.IsExtraordinaria ? await this.rhIds() : await this.gestoresDoSetor(s.Setor);
    aprovadores.forEach((id) => dest.add(id));
    dest.delete(s.SolicitanteId);
    await this.criar([...dest], `Nova solicitação de ${s.Nome} aguardando sua aprovação.`, 'NovaSolicitacao', s.Id);
  }

  /** Gestor aprovou → RH + admins (próxima fila) e o solicitante. */
  async notificarAprovacaoGestor(s: SolicitacaoLike) {
    const dest = new Set<number>(await this.adminIds());
    (await this.rhIds()).forEach((id) => dest.add(id));
    dest.delete(s.SolicitanteId);
    await this.criar([...dest], `Solicitação de ${s.Nome} aguardando aprovação do RH.`, 'NovaSolicitacao', s.Id);
    await this.criar([s.SolicitanteId], 'Sua solicitação foi aprovada pelo gestor.', 'AprovacaoGestor', s.Id);
  }

  /** RH aprovou → solicitante. */
  async notificarAprovacaoRH(s: SolicitacaoLike) {
    await this.criar([s.SolicitanteId], 'Sua solicitação foi aprovada pelo RH e liberada para a portaria.', 'AprovacaoRH', s.Id);
  }

  /** Reprovação (gestor/RH) → solicitante. */
  async notificarReprovacao(s: SolicitacaoLike, etapa: string, motivo: string) {
    await this.criar([s.SolicitanteId], `Sua solicitação foi reprovada pelo ${etapa}. Motivo: ${motivo}`, 'Reprovacao', s.Id);
  }
}
