import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Fallback exception filter for Prisma errors that are NOT covered by
 * the code-to-HTTP-status map in `providePrismaClientExceptionFilter`
 * (which handles P2000 → 400, P2002 → 409, P2003 → 409, P2025 → 404).
 *
 * - PrismaClientValidationError    → 400  Bad Request   (malformed query, programmer error)
 * - PrismaClientUnknownRequestError → 500 Internal Server Error
 *
 * In both cases the raw Prisma message is logged server-side but never
 * forwarded to the client, so internal schema details stay private.
 */
@Catch(Prisma.PrismaClientValidationError, Prisma.PrismaClientUnknownRequestError)
export class PrismaFallbackExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaFallbackExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientValidationError | Prisma.PrismaClientUnknownRequestError,
    host: ArgumentsHost
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientValidationError) {
      // Indicates a bad Prisma query (missing field, wrong type) - this is a
      // programmer error that should not reach production, but handle it cleanly.
      this.logger.warn(`Prisma validation error: ${exception.message}`);
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid request - check your request data',
        error: 'Bad Request',
      });
      return;
    }

    // PrismaClientUnknownRequestError - driver-level / network error.
    this.logger.error(`Prisma unknown request error: ${exception.message}`, (exception as Error).stack);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected database error occurred',
      error: 'Internal Server Error',
    });
  }
}
