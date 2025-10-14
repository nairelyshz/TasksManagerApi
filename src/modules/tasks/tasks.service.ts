import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async findAll(userId: string): Promise<Task[]> {
    this.logger.log(`Obteniendo todas las tareas del usuario: ${userId}`);

    const tasks = await this.taskRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return tasks;
  }

  async findOne(id: string, userId: string): Promise<Task> {
    this.logger.log(`Buscando tarea ${id} del usuario ${userId}`);

    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    // Verificar que la tarea pertenece al usuario
    if (task.userId !== userId) {
      this.logger.warn(
        `Usuario ${userId} intentó acceder a tarea ${id} de otro usuario`,
      );
      throw new ForbiddenException(
        'No tienes permiso para acceder a esta tarea',
      );
    }

    return task;
  }

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    this.logger.log(`Creando nueva tarea para usuario ${userId}`);

    const task = this.taskRepository.create({
      ...createTaskDto,
      userId,
      completed: createTaskDto.completed || false,
    });

    const savedTask = await this.taskRepository.save(task);

    this.logger.log(`Tarea creada exitosamente: ${savedTask.id}`);

    return savedTask;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    this.logger.log(`Actualizando tarea ${id} del usuario ${userId}`);

    // Verificar que la tarea existe y pertenece al usuario
    const task = await this.findOne(id, userId);

    // Actualizar campos
    Object.assign(task, updateTaskDto);

    const updatedTask = await this.taskRepository.save(task);

    this.logger.log(`Tarea ${id} actualizada exitosamente`);

    return updatedTask;
  }

  async delete(id: string, userId: string): Promise<void> {
    this.logger.log(`Eliminando tarea ${id} del usuario ${userId}`);

    // Verificar que la tarea existe y pertenece al usuario
    const task = await this.findOne(id, userId);

    await this.taskRepository.remove(task);

    this.logger.log(`Tarea ${id} eliminada exitosamente`);
  }

  async toggleCompleted(id: string, userId: string): Promise<Task> {
    this.logger.log(`Cambiando estado de tarea ${id} del usuario ${userId}`);

    const task = await this.findOne(id, userId);

    task.completed = !task.completed;

    const updatedTask = await this.taskRepository.save(task);

    this.logger.log(
      `Tarea ${id} marcada como ${updatedTask.completed ? 'completada' : 'pendiente'}`,
    );

    return updatedTask;
  }

  async getStats(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
  }> {
    this.logger.log(`Obteniendo estadísticas del usuario ${userId}`);

    const tasks = await this.taskRepository.find({
      where: { userId },
    });

    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const pending = total - completed;

    return { total, completed, pending };
  }
}
