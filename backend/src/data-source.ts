import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { Ride } from './rides/entities/ride.entity';
import { RideRequest } from './rides/entities/ride_request.entity';
dotenv.config();

export const AppDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? process.env.host ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? process.env.port ?? 5432),
  username: process.env.DATABASE_USER ?? process.env.username ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? process.env.password ?? '12307080',
  database: process.env.DATABASE_NAME ?? process.env.database ?? 'in_drive',
  entities: [User, Ride, RideRequest],
  synchronize: true,
  migrationsRun: false,
  logging: false,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
};

export const AppDataSource = new DataSource(AppDataSourceOptions);