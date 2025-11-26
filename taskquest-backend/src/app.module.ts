import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { AIModule } from './ai/ai.module';
import { AnalysisModule } from './analysis/analysis.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ProgressModule } from './progress/progress.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { GoalsModule } from './goals/goals.module';
import { ResetModule } from './reset/reset.module';
import { PlanAdjustmentModule } from './plan-adjustment/plan-adjustment.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://admin:password@localhost:27017/taskquest?authSource=admin',
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    AuthModule,
    UsersModule,
    TasksModule,
    ResetModule,
    PlanAdjustmentModule,
    AIModule,
    AnalysisModule,
    IntegrationsModule,
    ProgressModule,
    SchedulerModule,
    GoalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}