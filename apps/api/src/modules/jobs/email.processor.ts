import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { EmailService, type EmailTemplate } from "./email.service";

export type EmailJob = {
  to: string;
  subject?: string;
  template: EmailTemplate;
  data?: Record<string, any>;
};

@Processor("email")
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJob>) {
    this.logger.log(`Processing email job for ${job.data.to} (template: ${job.data.template})`);
    const subject = job.data.subject || this.getDefaultSubject(job.data.template);
    const result = await this.emailService.send({
      to: job.data.to,
      subject,
      template: job.data.template,
      data: job.data.data,
    });
    return result;
  }

  private getDefaultSubject(template: EmailJob["template"]): string {
    switch (template) {
      case "welcome":
        return "Welcome to Ceylon Weddings — Sri Lanka Planning Hub";
      case "inquiry":
        return "New Couple Inquiry Received — Ceylon Weddings";
      case "rsvp-reminder":
        return "Wedding RSVP Invitation & Details";
      case "subscription-invoice":
        return "Ceylon Weddings Pro Subscription Update";
      case "consultation-confirmed":
        return "Your Ceylon Weddings Consultation";
      case "consultation-new":
        return "New Consultation Booking — Ceylon Weddings";
      default:
        return "Ceylon Weddings Notification";
    }
  }
}

