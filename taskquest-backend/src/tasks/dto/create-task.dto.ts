import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ example: 'Estudar NestJS por 2 horas' })
  @IsString()
  text: string;

  @ApiProperty({ example: 100, minimum: 10, maximum: 100 })
  @IsNumber()
  @Min(10)
  @Max(100)
  xp: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ required: false, default: 'custom' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  aiData?: {
    reason?: string;
    suggestionType?: string;
    easyGoalId?: string;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  userId: string;
}