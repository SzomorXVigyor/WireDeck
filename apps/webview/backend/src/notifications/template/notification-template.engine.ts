import { Injectable } from '@nestjs/common';
import { RegisterCacheService } from '../../connection/register-cache.service';
import {
  Injector,
  makeRegisterRefInjector,
  makeTriggerValueInjector,
  makeTime2Injector,
  makeTime1Injector,
  makeDate2Injector,
  makeDate1Injector,
} from './notification-template.injectors';

// Template engine

/**
 * Processes notification body templates by replacing variable placeholders
 * with runtime values before an email is dispatched.
 *
 * --- Register values --------------------------------------------------------------
 *   #REG              Trigger value (unsigned uint16 by default)
 *   #REG:<id>         Cached value of register <id>
 *
 *   Both accept an optional format spec in square brackets:
 *     u | s           unsigned (default) or signed int16 (two's complement)
 *     N | +N          shift decimal point N places LEFT -> N decimal digits
 *     -N              shift decimal point N places RIGHT -> integer × 10^N
 *
 *   Examples:
 *     #REG[s]         re-interpret trigger as signed
 *     #REG:5[3]       register 5 divided by 1000, shown with 3 decimal places
 *     #REG[s-2]       signed trigger × 100
 *     #REG:12[u+4]    register 12 divided by 10000
 *
 * --- Time --------------------------------------------------------------
 *   #TIME  / #TIME1   hh-mm-ss
 *   #TIME2            hh. mm. ss.
 *
 * --- Date --------------------------------------------------------------
 *   #DATE  / #DATE1   yyyy-MM-dd
 *   #DATE2            yyyy. MM. dd.
 *
 * --- Escape --------------------------------------------------------------
 *   /#                literal "#"
 */
@Injectable()
export class NotificationTemplateEngine {
  constructor(private readonly cache: RegisterCacheService) {}

  fillContent(rawBody: string, triggerValue: number): string {
    const injectors: Injector[] = [
      makeRegisterRefInjector(this.cache),    // #REG:<id>[fmt] - must precede #REG
      makeTriggerValueInjector(triggerValue), // #REG[fmt]
      makeTime2Injector(),                    // #TIME2         - must precede #TIME/#TIME1
      makeTime1Injector(),                    // #TIME, #TIME1
      makeDate2Injector(),                    // #DATE2         - must precede #DATE/#DATE1
      makeDate1Injector(),                    // #DATE, #DATE1
    ];

    // Protect escaped "#" sequences so injectors never touch them
    let result = rawBody.replace(/\/#/g, '\x00ESC_HASH\x00');

    for (const { pattern, resolve } of injectors) {
      result = result.replace(pattern, resolve);
    }

    // Restore escaped "#"
    return result.replace(/\x00ESC_HASH\x00/g, '#');
  }
}
