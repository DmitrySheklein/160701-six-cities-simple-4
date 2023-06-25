import { Response, Router } from 'express';
import { ControllerInterface } from './controller.interface.js';
import { LoggerInterface } from '../logger/logger.interface.js';
import { injectable } from 'inversify';
import { RouteInterface } from '../../types/route.interface.js';
import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';
import { ConfigInterface } from '../../core/config/config.interface.js';
import { RestSchema } from '../../core/config/rest.schema.js';
import { UnknownRecord } from '../../types/unknown-record.type.js';
import { getFullServerPath, transformObject } from '../helpers/index.js';
import { STATIC_RESOURCE_FIELDS } from '../../app/app.constant.js';

@injectable()
export abstract class Controller implements ControllerInterface {
  private readonly _router: Router;

  constructor(
    protected readonly logger: LoggerInterface,
    protected readonly configService: ConfigInterface<RestSchema>,
  ) {
    this._router = Router();
  }

  get router() {
    return this._router;
  }

  protected addStaticPath(data: UnknownRecord): void {
    const fullServerPath = getFullServerPath(this.configService.get('HOST'), this.configService.get('PORT'));
    transformObject(
      STATIC_RESOURCE_FIELDS,
      `${fullServerPath}/${this.configService.get('STATIC_DIRECTORY_PATH')}`,
      `${fullServerPath}/${this.configService.get('UPLOAD_DIRECTORY')}`,
      data,
    );
  }

  public addRoute(route: RouteInterface): void {
    const routeHandler = asyncHandler(route.handler.bind(this));
    const middlewares = route.middlewares?.map((middleware) =>
      asyncHandler(middleware.execute.bind(middleware)),
    );

    const allHandlers = middlewares ? [...middlewares, routeHandler] : routeHandler;
    this._router[route.method](route.path, allHandlers);
    this.logger.info(`Route registered: ${route.method.toUpperCase()} ${route.path}`);
  }

  public send<T extends UnknownRecord>(res: Response, statusCode: number, data: T): void {
    this.addStaticPath(data);
    res.type('application/json').status(statusCode).json(data);
  }

  public created<T extends UnknownRecord>(res: Response, data: T): void {
    this.send(res, StatusCodes.CREATED, data);
  }

  public noContent(res: Response): void {
    this.send(res, StatusCodes.NO_CONTENT, {});
  }

  public ok<T extends UnknownRecord>(res: Response, data: T): void {
    this.send(res, StatusCodes.OK, data);
  }
}
