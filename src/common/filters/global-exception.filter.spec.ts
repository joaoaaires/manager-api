import {
  HttpException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

import { GlobalExceptionFilter } from './global-exception.filter';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
}

function createMockHost(): {
  host: ArgumentsHost;
  response: { status: jest.Mock; json: jest.Mock };
  getBody: () => ErrorResponseBody;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status, json };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;
  const getBody = (): ErrorResponseBody => {
    const calls = json.mock.calls as [ErrorResponseBody][];
    return calls[0][0];
  };
  return { host, response, getBody };
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should format HttpException with correct fields', () => {
    const { host, response, getBody } = createMockHost();
    const exception = new BadRequestException('Campo inválido');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(400);
    const body = getBody();
    expect(body).toMatchObject({
      statusCode: 400,
      error: 'BadRequestException',
    });
    expect(body).toHaveProperty('timestamp');
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it('should format NotFoundException correctly', () => {
    const { host, response, getBody } = createMockHost();
    const exception = new NotFoundException('Recurso não encontrado');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(404);
    const body = getBody();
    expect(body.statusCode).toBe(404);
    expect(body.error).toBe('NotFoundException');
  });

  it('should return 500 with generic message for non-HTTP errors', () => {
    const { host, response, getBody } = createMockHost();
    const exception = new Error('unexpected crash');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(500);
    const body = getBody();
    expect(body).toMatchObject({
      statusCode: 500,
      message: 'Erro interno do servidor.',
      error: 'InternalServerError',
    });
    expect(body).toHaveProperty('timestamp');
  });

  it('should return 500 for non-Error thrown values', () => {
    const { host, response, getBody } = createMockHost();

    filter.catch('string error', host);

    expect(response.status).toHaveBeenCalledWith(500);
    const body = getBody();
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('Erro interno do servidor.');
  });

  it('should handle HttpException with string response', () => {
    const { host, response, getBody } = createMockHost();
    const exception = new HttpException('Erro direto', 422);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(422);
    const body = getBody();
    expect(body.statusCode).toBe(422);
    expect(body.message).toBe('Erro direto');
  });

  it('should handle ValidationError-style BadRequestException (array message)', () => {
    const { host, response, getBody } = createMockHost();
    const exception = new BadRequestException([
      'O nome não pode ser vazio.',
      'O e-mail informado é inválido.',
    ]);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(400);
    const body = getBody();
    expect(body.statusCode).toBe(400);
    expect(body.message).toEqual([
      'O nome não pode ser vazio.',
      'O e-mail informado é inválido.',
    ]);
  });
});
