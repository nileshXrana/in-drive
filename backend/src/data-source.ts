import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { Ride } from './rides/entities/ride.entity';
dotenv.config();

export const AppDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.host,
  port: Number(process.env.port),
  username: process.env.username,
  password: process.env.password,
  database: process.env.database,
  entities: [User, Ride],
  synchronize: false,
  migrationsRun: true,
  logging: false,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
};

export const AppDataSource = new DataSource(AppDataSourceOptions);