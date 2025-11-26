import { IsString, IsOptional, IsArray } from 'class-validator';

export class AdjustPlanDto {
  @IsString()
  feedback: string;

  @IsOptional()
  @IsArray()
  specificIssues?: string[];

  @IsOptional()
  @IsString()
  userContext?: string;
}