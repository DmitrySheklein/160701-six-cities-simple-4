import cors from 'cors';
import helmet from 'helmet';
import { inject, injectable } from 'inversify';
import { ConfigInterface } from '../core/config/config.interface.js';
import { RestSchema } from '../core/config/rest.schema.js';
import { LoggerInterface } from '../core/logger/logger.interface.js';
import { AppComponent } from '../types/app-component.enum.js';
import { DatabaseClientInterface } from '../core/database-client/databese-client.interface.js';
import { getMongoURI } from '../core/helpers/db.js';
import express, { Express } from 'express';
import { ControllerInterface } from '../core/controller/controller.interface.js';
import { ExceptionFilterInterface } from '../core/exception-filters/common/exception-filter.interface.js';
import { AuthenticateMiddleware } from '../common/middlewares/authenticate.middleware.js';
import { getFullServerPath } from '../core/helpers/index.js';
import HttpError from '../core/errors/http-error.js';
import { StatusCodes } from 'http-status-codes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../specification/project.spec.json' assert { type: 'json' };

@injectable()
export default class ApiApplication {
  private expressApplication: Express;

  constructor(
    @inject(AppComponent.LoggerInterface) private readonly logger: LoggerInterface,
    @inject(AppComponent.ConfigInterface) private readonly config: ConfigInterface<RestSchema>,
    @inject(AppComponent.DatabaseClientInterface) private readonly databaseClient: DatabaseClientInterface,
    @inject(AppComponent.CityController) private readonly cityController: ControllerInterface,
    @inject(AppComponent.UserController) private readonly userController: ControllerInterface,
    @inject(AppComponent.OfferController) private readonly offerController: ControllerInterface,
    @inject(AppComponent.CommentController) private readonly commentController: ControllerInterface,
    @inject(AppComponent.BaseExceptionFilter) private readonly baseExceptionFilter: ExceptionFilterInterface,
    @inject(AppComponent.ValidationExceptionFilter)
    private readonly validationExceptionFilter: ExceptionFilterInterface,
    @inject(AppComponent.ValidationEntityExceptionFilter)
    private readonly validationEntityExceptionFilter: ExceptionFilterInterface,
    @inject(AppComponent.HttpErrorExceptionFilter)
    private readonly httpErrorExceptionFilter: ExceptionFilterInterface,
    @inject(AppComponent.SyntaxExceptionFilter)
    private readonly syntaxErrorExceptionFilter: ExceptionFilterInterface,
  ) {
    this.expressApplication = express();
  }

  private async _initDb() {
    this.logger.info('Init database…');
    const mongoUri = getMongoURI(
      this.config.get('DB_USER'),
      this.config.get('DB_PASSWORD'),
      this.config.get('DB_HOST'),
      this.config.get('DB_PORT'),
      this.config.get('DB_NAME'),
    );

    await this.databaseClient.connect(mongoUri);
    this.logger.info('Init database completed');
  }

  private async _initServer() {
    this.logger.info('Try to init server…');

    const port = this.config.get('PORT');
    this.expressApplication.listen(port);

    this.logger.info(
      `🚀Server started on ${getFullServerPath(this.config.get('HOST'), this.config.get('PORT'))}`,
    );
  }

  public async _initRoutes() {
    this.logger.info('Controller initialization…');
    this.expressApplication.use('/cities', this.cityController.router);
    this.expressApplication.use('/users', this.userController.router);
    this.expressApplication.use('/offers', this.offerController.router);
    this.expressApplication.use('/comments', this.commentController.router);
    this.expressApplication.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    this.expressApplication.all('*', (_req, _res) => {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Route not found');
    });
    this.logger.info('Controller initialization completed');
  }

  public async _initMiddleWare() {
    this.logger.info('Global middleware initialization…');
    this.expressApplication.use(helmet());
    this.expressApplication.use(express.json());
    this.expressApplication.use('/uploads', express.static(this.config.get('UPLOAD_DIRECTORY')));
    this.expressApplication.use('/static', express.static(this.config.get('STATIC_DIRECTORY_PATH')));
    const authentificateMiddleware = new AuthenticateMiddleware(this.config.get('JWT_SECRET'));
    this.expressApplication.use(authentificateMiddleware.execute.bind(authentificateMiddleware));
    this.expressApplication.use(cors());
    this.logger.info('Global middleware initialization completed');
  }

  private async _initExceptionFilters() {
    this.logger.info('Exception filters initialization');
    this.expressApplication.use(this.validationExceptionFilter.catch.bind(this.validationExceptionFilter));
    this.expressApplication.use(
      this.validationEntityExceptionFilter.catch.bind(this.validationEntityExceptionFilter),
    );
    this.expressApplication.use(this.httpErrorExceptionFilter.catch.bind(this.httpErrorExceptionFilter));
    this.expressApplication.use(this.syntaxErrorExceptionFilter.catch.bind(this.syntaxErrorExceptionFilter));
    this.expressApplication.use(this.baseExceptionFilter.catch.bind(this.baseExceptionFilter));
    this.logger.info('Exception filters completed');
  }

  public async init() {
    this.logger.info('Application initialization…');

    await this._initDb();
    await this._initMiddleWare();
    await this._initRoutes();
    await this._initExceptionFilters();
    await this._initServer();
  }
}
