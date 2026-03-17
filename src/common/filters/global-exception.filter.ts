import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ThrottlerException) {
      response.status(429).json({
        statusCode: 429,
        message:
          'Limite de requisições excedido. Tente novamente em alguns minutos.',
        error: 'TooManyRequestsException',
        timestamp: new Date().toISOString(),
      });
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message;

      response.status(status).json({
        statusCode: status,
        message,
        error: exception.name,
        timestamp: new Date().toISOString(),
      });
    } else {
      const error =
        exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(error.message, error.stack);

      response.status(500).json({
        statusCode: 500,
        message: 'Erro interno do servidor.',
        error: 'InternalServerError',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
