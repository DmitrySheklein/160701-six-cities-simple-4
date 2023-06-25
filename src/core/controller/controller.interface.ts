import { Response, Router } from 'express';
import { RouteInterface } from '../../types/route.interface.js';
import { UnknownRecord } from '../../types/unknown-record.type.js';

export interface ControllerInterface {
  readonly router: Router;
  addRoute(route: RouteInterface): void;
  send<T extends UnknownRecord>(res: Response, statusCode: number, data: T): void;
  ok<T extends UnknownRecord>(res: Response, data: T): void;
  created<T extends UnknownRecord>(res: Response, data: T): void;
  noContent<T>(res: Response, data: T): void;
}
