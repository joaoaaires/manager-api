import {
  HttpException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

import { GlobalExceptionFilter } from './global-exception.filter';

function createMockHost(): {
  host: ArgumentsHost;
  response: { status: jest.Mock; json: jest.Mock };
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
  return { host, response };
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
    const { host, response } = createMockHost();
    const exception = new BadRequestException('Campo inválido');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(400);
    const body = response.status.mock.results[0].value.json.mock.calls[0][0];
    expect(body).toMatchObject({
      statusCode: 400,
      error: 'BadRequestException',
    });
    expect(body).toHaveProperty('timestamp');
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it('should format NotFoundException correctly', () => {
    const { host, response } = createMockHost();
    const exception = new NotFoundException('Recurso não encontrado');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(404);
    const body = response.status.mock.results[0].value.json.mock.calls[0][0];
    expect(body.statusCode).toBe(404);
    expect(body.error).toBe('NotFoundException');
  });

  it('should return 500 with generic message for non-HTTP errors', () => {
    const { host, response } = createMockHost();
    const exception = new Error('unexpected crash');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(500);
    const body = response.status.mock.results[0].value.json.mock.calls[0][0];
    expect(body).toMatchObject({
      statusCode: 500,
      message: 'Erro interno do servidor.',
      error: 'InternalServerError',
    });
    expect(body).toHaveProperty('timestamp');
  });

  it('should return 500 for non-Error thrown values', () => {
    const { host, response } = createMockHost();

    filter.catch('string error', host);

    expect(response.status).toHaveBeenCalledWith(500);
    const body = response.status.mock.results[0].value.json.mock.calls[0][0];
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('Erro interno do servidor.');
  });

  it('should handle HttpException with string response', () => {
    const { host, response } = createMockHost();
    const exception = new HttpException('Erro direto', 422);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(422);
    const body = response.status.mock.results[0].value.json.mock.calls[0][0];
    expect(body.statusCode).toBe(422);
    expect(body.message).toBe('Erro direto');
  });

  it('should handle ValidationError-style BadRequestException (array message)', () => {
    const { host, response } = createMockHost();
    const exception = new BadRequestException([
      'O nome não pode ser vazio.',
      'O e-mail informado é inválido.',
    ]);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(400);
    const body = response.status.mock.results[0].value.json.mock.calls[0][0];
    expect(body.statusCode).toBe(400);
    expect(body.message).toEqual([
      'O nome não pode ser vazio.',
      'O e-mail informado é inválido.',
    ]);
  });
});
