import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSourceOptions } from './data-source';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { RidesModule } from './rides/rides.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSourceOptions),
    AuthModule,
    UserModule,
    RidesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
