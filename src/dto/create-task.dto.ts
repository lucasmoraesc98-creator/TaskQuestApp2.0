// dto/create-task.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    description: 'O texto da tarefa',
    example: 'Fazer exercícios',
  })
  text: string;

  @ApiProperty({ description: 'XP da tarefa', example: 100 })
  xp: number;

  @ApiProperty({ description: 'Data da tarefa', example: '2024-01-01' })
  date: string;
}
