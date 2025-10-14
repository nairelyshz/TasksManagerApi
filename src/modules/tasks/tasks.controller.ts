import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { JoiValidationPipe } from '../../common/pipes/joi-validation.pipe';
import { createTaskSchema, updateTaskSchema } from './schemas/task.schema';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las tareas del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tareas del usuario',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '550e8400-e29b-41d4-a716-446655440001',
          },
          title: { type: 'string', example: 'Completar proyecto' },
          description: {
            type: 'string',
            example: 'Terminar el backend con NestJS',
          },
          completed: { type: 'boolean', example: false },
          userId: {
            type: 'string',
            example: '550e8400-e29b-41d4-a716-446655440002',
          },
          createdAt: { type: 'string', example: '2025-10-14T12:00:00.000Z' },
          updatedAt: { type: 'string', example: '2025-10-14T12:00:00.000Z' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(@GetUser() user: User) {
    return this.tasksService.findAll(user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de tareas del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de tareas',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 10 },
        completed: { type: 'number', example: 7 },
        pending: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getStats(@GetUser() user: User) {
    return this.tasksService.getStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarea específica' })
  @ApiParam({ name: 'id', description: 'ID de la tarea', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Tarea encontrada',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440001' },
        title: { type: 'string', example: 'Completar proyecto' },
        description: {
          type: 'string',
          example: 'Terminar el backend con NestJS',
        },
        completed: { type: 'boolean', example: false },
        userId: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440002',
        },
        createdAt: { type: 'string', example: '2025-10-14T12:00:00.000Z' },
        updatedAt: { type: 'string', example: '2025-10-14T12:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para acceder a esta tarea',
  })
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.tasksService.findOne(id, user.id);
  }

  @Post()
  @UsePipes(new JoiValidationPipe(createTaskSchema))
  @ApiOperation({ summary: 'Crear una nueva tarea' })
  @ApiResponse({
    status: 201,
    description: 'Tarea creada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async create(@Body() createTaskDto: CreateTaskDto, @GetUser() user: User) {
    return this.tasksService.create(createTaskDto, user.id);
  }

  @Put(':id')
  @UsePipes(new JoiValidationPipe(updateTaskSchema))
  @ApiOperation({ summary: 'Actualizar una tarea' })
  @ApiParam({ name: 'id', description: 'ID de la tarea', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Tarea actualizada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para modificar esta tarea',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser() user: User,
  ) {
    return this.tasksService.update(id, updateTaskDto, user.id);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Cambiar estado completado/pendiente de una tarea' })
  @ApiParam({ name: 'id', description: 'ID de la tarea', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Estado de la tarea cambiado exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para modificar esta tarea',
  })
  async toggleCompleted(@Param('id') id: string, @GetUser() user: User) {
    return this.tasksService.toggleCompleted(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una tarea' })
  @ApiParam({ name: 'id', description: 'ID de la tarea', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Tarea eliminada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Tarea eliminada exitosamente' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para eliminar esta tarea',
  })
  async delete(@Param('id') id: string, @GetUser() user: User) {
    await this.tasksService.delete(id, user.id);
    return { message: 'Tarea eliminada exitosamente' };
  }
}
