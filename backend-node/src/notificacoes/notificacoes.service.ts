import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

type SolicitacaoLike = {
  Id: number;
  Nome: string;
  Setor: string;
  SolicitanteId: number;
  ColaboradorId?: number | null;
  IsExtraordinaria: boolean;
};

/**
 * Ponto único de criação de notificações internas (in-app) e disparo de e-mails.
 */
@Injectable()
export class NotificacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

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
  }

  private async usuariosPorPerfil(perfil: string): Promise<{ Id: number; Email: string }[]> {
    return this.prisma.usuarios.findMany({
      where: { Perfil: perfil, Status: 'Ativo' },
      select: { Id: true, Email: true },
    });
  }

  private async adminIds(): Promise<number[]> {
    return (await this.usuariosPorPerfil('Admin')).map((u) => u.Id);
  }

  private async rhIds(): Promise<number[]> {
    return (await this.usuariosPorPerfil('RH')).map((u) => u.Id);
  }

  private async gestoresDoSetor(setor: string): Promise<number[]> {
    const r = await this.prisma.usuarios.findMany({
      where: { Perfil: 'Gestor', Status: 'Ativo', Setor: { equals: setor, mode: 'insensitive' } },
      select: { Id: true },
    });
    return r.map((u) => u.Id);
  }

  /** Solicitante (quem criou) + colaborador (quem sai, se terceiro). */
  private interessados(s: SolicitacaoLike): number[] {
    return [...new Set([s.SolicitanteId, ...(s.ColaboradorId ? [s.ColaboradorId] : [])])];
  }

  /** Nova solicitação → gestores do setor (ou RH, se extraordinária) + admins. */
  async notificarNovaSolicitacao(s: SolicitacaoLike) {
    const dest = new Set<number>(await this.adminIds());
    const aprovadores = s.IsExtraordinaria ? await this.rhIds() : await this.gestoresDoSetor(s.Setor);
    aprovadores.forEach((id) => dest.add(id));
    dest.delete(s.SolicitanteId);
    await this.criar([...dest], `Nova solicitação de ${s.Nome} aguardando sua aprovação.`, 'NovaSolicitacao', s.Id);
  }

  /** Gestor aprovou → RH + admins (próxima fila) e os interessados. */
  async notificarAprovacaoGestor(s: SolicitacaoLike) {
    const dest = new Set<number>(await this.adminIds());
    (await this.rhIds()).forEach((id) => dest.add(id));
    dest.delete(s.SolicitanteId);
    await this.criar([...dest], `Solicitação de ${s.Nome} aguardando aprovação do RH.`, 'NovaSolicitacao', s.Id);
    await this.criar(this.interessados(s), 'Sua solicitação foi aprovada pelo gestor.', 'AprovacaoGestor', s.Id);
  }

  /** RH aprovou → interessados. */
  async notificarAprovacaoRH(s: SolicitacaoLike) {
    await this.criar(this.interessados(s), 'Sua solicitação foi aprovada pelo RH e liberada para a portaria.', 'AprovacaoRH', s.Id);
  }

  /** Reprovação (gestor/RH) → interessados. */
  async notificarReprovacao(s: SolicitacaoLike, etapa: string, motivo: string) {
    await this.criar(this.interessados(s), `Sua solicitação foi reprovada pelo ${etapa}. Motivo: ${motivo}`, 'Reprovacao', s.Id);
  }

  /**
   * Bypass do RH (Exceção Máxima do gestor) → RH recebe in-app + e-mail
   * para auditar e validar a saída no dia seguinte (aprovação post-facto).
   */
  async notificarBypassRH(s: SolicitacaoLike, gestorNome: string, motivo?: string | null) {
    const rh = await this.usuariosPorPerfil('RH');
    const dest = new Set<number>([...rh.map((u) => u.Id), ...(await this.adminIds())]);
    dest.delete(s.SolicitanteId);

    const msg =
      `⚠ Exceção Máxima: saída #${s.Id} de ${s.Nome} (${s.Setor}) liberada pelo gestor ${gestorNome} ` +
      `sem aprovação do RH. Audite e valide esta saída (aprovação post-facto).`;
    await this.criar([...dest], msg, 'AuditoriaPostFacto', s.Id);
    await this.criar(this.interessados(s), 'Sua solicitação foi liberada por exceção do gestor e segue para a portaria.', 'AprovacaoGestor', s.Id);

    await this.mail.enviar(
      rh.map((u) => u.Email),
      `[FluxoSafe] Auditoria pendente — saída #${s.Id} liberada por Exceção Máxima`,
      `<p>A solicitação de saída <strong>#${s.Id}</strong> de <strong>${s.Nome}</strong> (setor ${s.Setor})
        foi liberada diretamente para a portaria pelo gestor <strong>${gestorNome}</strong>,
        com assunção de risco e sem a aprovação do RH.</p>
       ${motivo ? `<p><strong>Justificativa do gestor:</strong> ${motivo}</p>` : ''}
       <p>É necessário auditar e validar esta saída no próximo dia útil (aprovação post-facto),
        na aba <strong>Auditoria Post-Facto</strong> do FluxoSafe.</p>`,
    );
  }
}
