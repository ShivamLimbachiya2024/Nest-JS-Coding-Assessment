import { Injectable } from '@nestjs/common'
import { AppConfigService } from '../../config/src/config.service.js'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js'

@Injectable()
export class DatabaseService {
  static options(
    config: AppConfigService,
    migrationOwner: string,
    entities: PostgresConnectionOptions['entities'],
    migrations: PostgresConnectionOptions['migrations'],
  ): PostgresConnectionOptions {
    config.validateDatabase()

    return {
      type: 'postgres',
      host: config.databaseHost,
      port: config.databasePort,
      username: config.databaseUser,
      password: config.databasePassword,
      database: config.databaseName,
      entities,
      migrations,
      migrationsTableName: `${migrationOwner}_migrations`,
      migrationsRun: false,
      synchronize: false,
      logging: false,
    }
  }
}
