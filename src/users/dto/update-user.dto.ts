import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { RegisterDto } from '../../auth/dto/register.dto';

export class UpdateUserDto extends PartialType(RegisterDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  goals?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  challenges?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  preferences?: {
    morningPerson?: boolean;
    likesExercise?: boolean;
    worksFromHome?: boolean;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productivityStyle?: string;
}
