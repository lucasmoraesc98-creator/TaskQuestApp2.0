import { IsString, IsArray, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGoalPlanDto {
  @ApiProperty()
  @IsString()
  vision: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  goals: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  challenges: string[];

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tools?: string[];

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  hoursPerWeek?: number;

  // ✅ ADICIONAR SKILLS
  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];
}