import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

// Maps every thrown exception to RFC 7807 problem+json. Stack traces and ORM
// error text never reach the client (CLAUDE.md §9).
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = exception instanceof HttpException ? exception.getResponse() : undefined;
    const rawDetail =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message: string | string[] }).message
        : exception instanceof HttpException
          ? exception.message
          : 'An unexpected error occurred.';

    response.status(status).type('application/problem+json').json({
      type: 'about:blank',
      title: HttpStatus[status] ?? 'Error',
      status,
      detail: Array.isArray(rawDetail) ? rawDetail.join(', ') : rawDetail,
    });
  }
}
