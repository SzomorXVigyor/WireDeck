import { Injectable } from '@nestjs/common';

/**
 * In-memory register value cache.
 *
 * Keys   : registerId (number)
 * Values : last successfully polled value (number)
 *
 * `get()` returns 0 for any register that has not yet been polled.
 * The cache is written ONLY by DataCollectorService (scheduled reads)
 * and by ConnectionManagerService (after a successful write).
 * REST-API reads never trigger device polls - they only read from here.
 */
@Injectable()
export class RegisterCacheService {
  private readonly cache = new Map<number, number>();

  /** Returns the cached value, or 0 if the register has never been polled. */
  get(registerId: number): number {
    return this.cache.get(registerId) ?? 0;
  }

  /** Returns values for a list of register IDs (0 for missing entries). */
  getMany(registerIds: number[]): Map<number, number> {
    const result = new Map<number, number>();
    for (const id of registerIds) {
      result.set(id, this.get(id));
    }
    return result;
  }

  set(registerId: number, value: number): void {
    this.cache.set(registerId, value);
  }

  delete(registerId: number): void {
    this.cache.delete(registerId);
  }

  has(registerId: number): boolean {
    return this.cache.has(registerId);
  }
}
