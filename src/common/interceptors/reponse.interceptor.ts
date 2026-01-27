import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';

interface ResponseObject {
  message?: string | string[];
  response?: {
    message?: string | string[];
  };
  [key: string]: any;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((data: unknown) => {
        const statusCode = response.statusCode;
        const responseObj = data as ResponseObject;

        // Pour BadRequestException, utilisez le message de l'exception
        let message: string | string[] = 'Success';
        if (data instanceof BadRequestException) {
          const exceptionResponse = data.getResponse() as
            | string
            | { message: string | string[] };

          if (
            typeof exceptionResponse === 'object' &&
            exceptionResponse?.message
          ) {
            message = exceptionResponse.message || 'Bad request';
          }
        } else if (responseObj?.message) {
          message = responseObj.message;
        }

        // Nettoyer les données de réponse
        let responseData: unknown = data;
        if (responseObj?.message) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { message: _, ...rest } = responseObj;
          responseData = rest;
        }

        // Pour les exceptions, la structure est différente
        if (responseObj?.response?.message) {
          message = responseObj.response.message;
          responseData = null;
        }

        return {
          statusCode,
          success: statusCode >= 200 && statusCode < 300,
          message,
          data: responseData,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
