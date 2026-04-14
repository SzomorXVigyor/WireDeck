import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ConditionOperator } from '@prisma/client';
import { RegisterCacheService } from '../connection/register-cache.service';
import { DataCollectorService, RegisterValueChangeHandler } from '../connection/data-collector.service';
import { MAIL_GATEWAY_URL } from '../utils/env';

// ---------------------------------------------------------------------------
// Self-attribute type carried by every notification handler.
// ---------------------------------------------------------------------------

export interface NotificationHandlerSelf {
  /** Database ID of the notification entry this handler belongs to. */
  notificationId: number;
}

// ---------------------------------------------------------------------------
// Template injector definition - easily extendable.
// ---------------------------------------------------------------------------

type Injector = {
  /** Pattern to search for in the email body. */
  pattern: RegExp;
  /** Returns the replacement string. Receives the full match and capture groups. */
  resolve: (match: string, ...groups: string[]) => string;
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class NotificationSenderService implements OnModuleInit {
  private readonly logger = new Logger(NotificationSenderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RegisterCacheService,
    private readonly dataCollector: DataCollectorService
  ) {}

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async onModuleInit(): Promise<void> {
    const notifications = await this.prisma.notification.findMany({
      select: { id: true, registerId: true },
    });

    for (const n of notifications) {
      this.attachHandler(n.id, n.registerId);
    }

    this.logger.log(`Attached ${notifications.length} notification handler(s) on startup`);
  }

  // ---------------------------------------------------------------------------
  // Public handler management
  // ---------------------------------------------------------------------------

  /**
   * Attach a value-change handler for the given notification entry.
   * Calling this with the same notificationId + registerId is idempotent
   * (the DataCollector will replace the existing key).
   */
  attachHandler(notificationId: number, registerId: number): void {
    const key = `notification:${notificationId}`;
    const selfAttr: NotificationHandlerSelf = { notificationId };

    // Bind explicitly so `this` is correct when called from DataCollector
    const boundHandler: RegisterValueChangeHandler<NotificationHandlerSelf> = this.handleRegisterChange.bind(this);

    this.dataCollector.addRegisterValueChangeHandler(registerId, key, selfAttr, boundHandler);
    this.logger.debug(`Handler attached - key="${key}" registerId=${registerId}`);
  }

  /**
   * Remove the handler for the given notification entry from the given register.
   */
  detachHandler(notificationId: number, registerId: number): void {
    const key = `notification:${notificationId}`;
    this.dataCollector.removeRegisterValueChangeHandler(registerId, key);
    this.logger.debug(`Handler detached - key="${key}" registerId=${registerId}`);
  }

  // ---------------------------------------------------------------------------
  // Handler
  // ---------------------------------------------------------------------------

  private async handleRegisterChange(_regId: number, value: number, self: NotificationHandlerSelf): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: self.notificationId },
      select: { operator: true, conditionValue: true, recipients: true, subject: true, body: true },
    });

    // Entry was deleted after this handler was registered - silently return.
    if (!notification) {
      this.logger.warn(`Notification ${self.notificationId} no longer exists - skipping handler`);
      return;
    }

    if (!this.evaluateCondition(notification.operator, value, notification.conditionValue)) {
      return;
    }

    const body = this.fillContent(notification.body, value);
    await this.sendEmail(notification.recipients, notification.subject, body);
  }

  // ---------------------------------------------------------------------------
  // Condition evaluation
  // ---------------------------------------------------------------------------

  private evaluateCondition(operator: ConditionOperator, value: number, threshold: number): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      case 'neq':
        return value !== threshold;
      default:
        return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Template engine
  // ---------------------------------------------------------------------------

  /**
   * Fill template variables in `rawBody` using `triggerValue` and the
   * register cache for cross-register references.
   *
   * Supported syntax:
   *   #REG           → the value that triggered the notification
   *   #REG:<id>      → cached value of register <id>
   *   #TIME          → current date-time in "YYYY. MM. DD. hh. mm. ss." format
   *   /#             → escaped literal "#" (output: "#")
   */
  fillContent(rawBody: string, triggerValue: number): string {
    const injectors: Injector[] = [
      {
        // #REG:<id> - must be checked before plain #REG
        pattern: /#REG:(\d+)/g,
        resolve: (_match, id) => String(this.cache.get(parseInt(id, 10))),
      },
      {
        pattern: /#REG/g,
        resolve: () => String(triggerValue),
      },
      {
        pattern: /#TIME/g,
        resolve: () => this.formatDateTime(new Date()),
      },
    ];

    // Temporarily protect escaped sequences so injectors don't touch them
    let result = rawBody.replace(/\/#/g, '\x00ESC_HASH\x00');

    for (const { pattern, resolve } of injectors) {
      result = result.replace(pattern, resolve);
    }

    // Restore escaped "#"
    result = result.replace(/\x00ESC_HASH\x00/g, '#');

    return result;
  }

  private formatDateTime(date: Date): string {
    const p = (n: number, len = 2) => String(n).padStart(len, '0');
    return (
      `${date.getFullYear()}. ${p(date.getMonth() + 1)}. ${p(date.getDate())}. ` +
      `${p(date.getHours())}. ${p(date.getMinutes())}. ${p(date.getSeconds())}.`
    );
  }

  // ---------------------------------------------------------------------------
  // Email send-out
  // ---------------------------------------------------------------------------

  /**
   * Send an email via the configured mail gateway service.
   *
   * POST <MAIL_GATEWAY_URL>/send
   * Body: { destination: string[], subject: string, content: string }
   */
  async sendEmail(recipients: string[], subject: string, content: string): Promise<void> {
    if (!MAIL_GATEWAY_URL) {
      this.logger.warn('MAIL_GATEWAY_URL is not configured - email will not be sent');
      return;
    }

    try {
      const response = await fetch(`${MAIL_GATEWAY_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: recipients, subject, content }),
      });

      if (!response.ok) {
        this.logger.error(`Mail gateway responded with ${response.status}: ${await response.text()}`);
      } else {
        this.logger.debug(`Email sent to [${recipients.join(', ')}] - subject: "${subject}"`);
      }
    } catch (err) {
      this.logger.error(`Failed to reach mail gateway: ${String(err)}`);
    }
  }
}
