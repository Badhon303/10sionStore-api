import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;
    const host = this.config.get<string>('SMTP_HOST');
    const sendgridKey = this.config.get<string>('SENDGRID_API_KEY');

    if (sendgridKey) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: { user: 'apikey', pass: sendgridKey },
      });
    } else if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') || 587),
        secure: false,
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
    }
    return this.transporter;
  }

  async send(to: string, subject: string, html: string): Promise<EmailResult> {
    const transporter = this.getTransporter();
    const from = this.config.get<string>('MAIL_FROM') || 'no-reply@storex.local';
    if (!transporter) {
      this.logger.warn(`[DEV EMAIL] to=${to} subject="${subject}"`);
      return { success: true, messageId: 'dev' };
    }
    try {
      const info = await transporter.sendMail({ from, to, subject, html });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      this.logger.error(`Email send failed: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  async sendBulk(recipients: string[], subject: string, html: string) {
    return Promise.all(recipients.map((to) => this.send(to, subject, html)));
  }
}
