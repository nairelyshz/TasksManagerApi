import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto {
  @ApiProperty({
    example: 'Completar proyecto de NestJS (actualizado)',
    description: 'Título de la tarea',
    required: false,
  })
  title?: string;

  @ApiProperty({
    example: 'Terminar el backend con todas las funcionalidades',
    description: 'Descripción detallada de la tarea',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Estado de la tarea (completada o no)',
    required: false,
  })
  completed?: boolean;
}
