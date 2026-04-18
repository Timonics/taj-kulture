import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send')
  async handleSend(job: Job) {
    const { to, subject, template, context } = job.data;
    this.logger.log(`Sending email to ${to} with template ${template}`);
    // Integrate with Termii or SendGrid here
    // Simulate async work
    await new Promise(resolve => setTimeout(resolve, 500));
    this.logger.log(`Email sent to ${to}`);
    return { delivered: true };
  }
}