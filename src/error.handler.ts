import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { BaseError } from './error';

@Catch(BaseError)
export class BaseErrorFilter implements ExceptionFilter {
  catch(exception: BaseError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    response.status(exception.status).json({
      code: exception.code,
      message: exception.message,
    });
  }
}
