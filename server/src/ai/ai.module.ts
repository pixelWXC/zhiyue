import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { UsageModule } from '../usage/usage.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        HttpModule,
        ConfigModule,
        UsageModule,
    ],
    controllers: [AiController],
    providers: [AiService],
})
export class AiModule { }
