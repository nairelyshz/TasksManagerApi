import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: Repository<Task>;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const otherUserId = '987e6543-e21b-43d2-b654-321987654321';

  const mockTask: Task = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    completed: false,
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: null,
  };

  const mockTaskRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all tasks for a user', async () => {
      const mockTasks = [mockTask, { ...mockTask, id: 'task-456' }];
      mockTaskRepository.find.mockResolvedValue(mockTasks);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual(mockTasks);
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array if user has no tasks', async () => {
      mockTaskRepository.find.mockResolvedValue([]);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should only return tasks for the specified user', async () => {
      const userTasks = [mockTask];
      mockTaskRepository.find.mockResolvedValue(userTasks);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual(userTasks);
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a task by id for the owner', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('task-123', mockUserId);

      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-123' },
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('nonexistent-id', mockUserId),
      ).rejects.toThrow('Tarea no encontrada');
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.findOne('task-123', otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne('task-123', otherUserId)).rejects.toThrow(
        'No tienes acceso a esta tarea',
      );
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        completed: false,
      };

      const newTask = {
        ...mockTask,
        ...createTaskDto,
      };

      mockTaskRepository.create.mockReturnValue(newTask);
      mockTaskRepository.save.mockResolvedValue(newTask);

      const result = await service.create(createTaskDto, mockUserId);

      expect(result).toEqual(newTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        userId: mockUserId,
      });
      expect(mockTaskRepository.save).toHaveBeenCalledWith(newTask);
    });

    it('should create task with only title (description optional)', async () => {
      const createTaskDto = {
        title: 'Task without description',
      };

      const newTask = {
        ...mockTask,
        title: createTaskDto.title,
        description: null,
      };

      mockTaskRepository.create.mockReturnValue(newTask);
      mockTaskRepository.save.mockResolvedValue(newTask);

      const result = await service.create(createTaskDto, mockUserId);

      expect(result.title).toBe(createTaskDto.title);
      expect(result.description).toBeNull();
    });

    it('should set completed to false by default', async () => {
      const createTaskDto = {
        title: 'New Task',
      };

      const newTask = {
        ...mockTask,
        ...createTaskDto,
        completed: false,
      };

      mockTaskRepository.create.mockReturnValue(newTask);
      mockTaskRepository.save.mockResolvedValue(newTask);

      const result = await service.create(createTaskDto, mockUserId);

      expect(result.completed).toBe(false);
    });

    it('should associate task with correct user', async () => {
      const createTaskDto = {
        title: 'New Task',
      };

      mockTaskRepository.create.mockImplementation((data) => data as Task);
      mockTaskRepository.save.mockImplementation(async (task) => task);

      await service.create(createTaskDto, mockUserId);

      expect(mockTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updatedTask = {
        ...mockTask,
        ...updateTaskDto,
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(updatedTask);

      const result = await service.update(
        'task-123',
        updateTaskDto,
        mockUserId,
      );

      expect(result).toEqual(updatedTask);
      expect(mockTaskRepository.save).toHaveBeenCalledWith({
        ...mockTask,
        ...updateTaskDto,
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', { title: 'Updated' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(
        service.update('task-123', { title: 'Updated' }, otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow partial updates', async () => {
      const updateTaskDto = {
        title: 'Only Title Updated',
      };

      const updatedTask = {
        ...mockTask,
        title: updateTaskDto.title,
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(updatedTask);

      const result = await service.update(
        'task-123',
        updateTaskDto,
        mockUserId,
      );

      expect(result.title).toBe(updateTaskDto.title);
      expect(result.description).toBe(mockTask.description);
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.remove.mockResolvedValue(mockTask);

      await service.delete('task-123', mockUserId);

      expect(mockTaskRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.delete('nonexistent-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.delete('task-123', otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('toggleCompleted', () => {
    it('should toggle task from incomplete to complete', async () => {
      const incompleteTask = { ...mockTask, completed: false };
      const completedTask = { ...mockTask, completed: true };

      mockTaskRepository.findOne.mockResolvedValue(incompleteTask);
      mockTaskRepository.save.mockResolvedValue(completedTask);

      const result = await service.toggleCompleted('task-123', mockUserId);

      expect(result.completed).toBe(true);
      expect(mockTaskRepository.save).toHaveBeenCalledWith({
        ...incompleteTask,
        completed: true,
      });
    });

    it('should toggle task from complete to incomplete', async () => {
      const completedTask = { ...mockTask, completed: true };
      const incompleteTask = { ...mockTask, completed: false };

      mockTaskRepository.findOne.mockResolvedValue(completedTask);
      mockTaskRepository.save.mockResolvedValue(incompleteTask);

      const result = await service.toggleCompleted('task-123', mockUserId);

      expect(result.completed).toBe(false);
      expect(mockTaskRepository.save).toHaveBeenCalledWith({
        ...completedTask,
        completed: false,
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.toggleCompleted('nonexistent-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(
        service.toggleCompleted('task-123', otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      mockTaskRepository.count.mockResolvedValueOnce(10); // total
      mockTaskRepository.count.mockResolvedValueOnce(7); // completed
      mockTaskRepository.count.mockResolvedValueOnce(3); // pending

      const result = await service.getStats(mockUserId);

      expect(result).toEqual({
        total: 10,
        completed: 7,
        pending: 3,
      });
      expect(mockTaskRepository.count).toHaveBeenCalledTimes(3);
    });

    it('should return zeros for user with no tasks', async () => {
      mockTaskRepository.count.mockResolvedValue(0);

      const result = await service.getStats(mockUserId);

      expect(result).toEqual({
        total: 0,
        completed: 0,
        pending: 0,
      });
    });

    it('should only count tasks for the specified user', async () => {
      mockTaskRepository.count.mockResolvedValue(5);

      await service.getStats(mockUserId);

      expect(mockTaskRepository.count).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(mockTaskRepository.count).toHaveBeenCalledWith({
        where: { userId: mockUserId, completed: true },
      });
      expect(mockTaskRepository.count).toHaveBeenCalledWith({
        where: { userId: mockUserId, completed: false },
      });
    });

    it('should return correct counts when total equals completed plus pending', async () => {
      mockTaskRepository.count.mockResolvedValueOnce(15); // total
      mockTaskRepository.count.mockResolvedValueOnce(9); // completed
      mockTaskRepository.count.mockResolvedValueOnce(6); // pending

      const result = await service.getStats(mockUserId);

      expect(result.total).toBe(result.completed + result.pending);
      expect(result.total).toBe(15);
      expect(result.completed).toBe(9);
      expect(result.pending).toBe(6);
    });
  });

  describe('Ownership Validation', () => {
    it('should validate ownership for findOne', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.findOne('task-123', otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should validate ownership for update', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(
        service.update('task-123', { title: 'Updated' }, otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate ownership for delete', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.delete('task-123', otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should validate ownership for toggleCompleted', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(
        service.toggleCompleted('task-123', otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
