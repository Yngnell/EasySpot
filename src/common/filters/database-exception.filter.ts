import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Turns MySQL constraint errors into clear HTTP responses instead of a
 * generic 500, e.g. deleting a space that still has reservations -> 409.
 */
@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const code = (exception.driverError as { code?: string }).code;

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'Internal server error';

    switch (code) {
      case 'ER_DUP_ENTRY':
        statusCode = HttpStatus.CONFLICT;
        error = 'Conflict';
        message = 'A record with the same unique value already exists';
        break;
      case 'ER_ROW_IS_REFERENCED':
      case 'ER_ROW_IS_REFERENCED_2':
        statusCode = HttpStatus.CONFLICT;
        error = 'Conflict';
        message =
          'This record is still used by other records (e.g. reservations) and cannot be deleted';
        break;
      case 'ER_NO_REFERENCED_ROW':
      case 'ER_NO_REFERENCED_ROW_2':
        statusCode = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        message = 'A related record does not exist';
        break;
      default:
        this.logger.error(exception.message, exception.stack);
    }

    response.status(statusCode).json({ message, error, statusCode });
  }
}
