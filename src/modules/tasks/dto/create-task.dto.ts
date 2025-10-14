import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Completar proyecto de NestJS',
    description: 'Título de la tarea',
    minLength: 1,
    maxLength: 255,
  })
  title: string;

  @ApiProperty({
    example: 'Terminar el backend del task manager con autenticación JWT',
    description: 'Descripción detallada de la tarea',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: false,
    description: 'Estado de la tarea (completada o no)',
    default: false,
    required: false,
  })
  completed?: boolean;
}
