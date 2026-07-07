import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Envio de e-mail via SMTP. Configuração por variáveis de ambiente:
 *   SMTP_HOST, SMTP_PORT (padrão 587), SMTP_USER, SMTP_PASS, SMTP_FROM.
 * Sem SMTP_HOST definido, os envios são apenas registrados no log (dev).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    this.from = process.env.SMTP_FROM ?? 'no-reply@fluxosafe.local';
    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        })
      : null;
  }

  async enviar(para: string[], assunto: string, html: string): Promise<void> {
    if (para.length === 0) return;
    if (!this.transporter) {
      this.logger.log(`[SMTP não configurado] Para: ${para.join(', ')} — Assunto: ${assunto}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to: para.join(', '), subject: assunto, html });
    } catch (err) {
      // Falha de e-mail não pode derrubar o fluxo de aprovação.
      this.logger.error(`Falha ao enviar e-mail "${assunto}": ${(err as Error).message}`);
    }
  }
}
