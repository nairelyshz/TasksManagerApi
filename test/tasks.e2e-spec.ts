import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Tasks Endpoints (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let taskId: string;
  let otherUserToken: string;

  const testUser = {
    email: `task-test-${Date.now()}@example.com`,
    password: 'TaskTest123',
    name: 'Task Test User',
  };

  const otherUser = {
    email: `other-task-${Date.now()}@example.com`,
    password: 'OtherTask123',
    name: 'Other Task User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    // Register and login main test user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser);

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Register another user for ownership tests
    const otherUserResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(otherUser);

    otherUserToken = otherUserResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/tasks (POST)', () => {
    it('should create a new task successfully', () => {
      return request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          completed: false,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Test Task');
          expect(res.body.description).toBe('Test Description');
          expect(res.body.completed).toBe(false);
          expect(res.body.userId).toBe(userId);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          taskId = res.body.id;
        });
    });

    it('should create task with only title (description optional)', () => {
      return request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task without description',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('Task without description');
          expect(res.body.description).toBeNull();
          expect(res.body.completed).toBe(false);
        });
    });

    it('should create task with completed status', () => {
      return request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Already completed task',
          completed: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.completed).toBe(true);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/tasks')
        .send({
          title: 'Test Task',
        })
        .expect(401);
    });

    it('should fail with empty title', () => {
      return request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
        })
        .expect(400);
    });

    it('should fail without title', () => {
      return request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Description only',
        })
        .expect(400);
    });

    it('should trim whitespace from title', () => {
      return request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '  Trimmed Task  ',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('Trimmed Task');
        });
    });
  });

  describe('/api/tasks (GET)', () => {
    it('should get all tasks for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          // All tasks should belong to the user
          res.body.forEach((task) => {
            expect(task.userId).toBe(userId);
          });
        });
    });

    it('should return empty array if user has no tasks', () => {
      return request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/api/tasks').expect(401);
    });

    it('should not show tasks from other users', async () => {
      // Create task for other user
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Other user task',
        });

      // Main user should not see it
      const response = await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const otherUserTasks = response.body.filter(
        (task) => task.title === 'Other user task',
      );
      expect(otherUserTasks.length).toBe(0);
    });
  });

  describe('/api/tasks/:id (GET)', () => {
    it('should get a specific task by id', () => {
      return request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(taskId);
          expect(res.body.title).toBe('Test Task');
          expect(res.body.userId).toBe(userId);
        });
    });

    it('should fail for non-existent task', () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Tarea no encontrada');
        });
    });

    it('should fail for invalid UUID format', () => {
      return request(app.getHttpServer())
        .get('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .expect(401);
    });

    it('should fail when accessing another users task', async () => {
      // Create task with other user
      const otherTaskResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Other user private task',
        });

      const otherTaskId = otherTaskResponse.body.id;

      // Main user should not be able to access it
      return request(app.getHttpServer())
        .get(`/api/tasks/${otherTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('acceso');
        });
    });
  });

  describe('/api/tasks/:id (PUT)', () => {
    it('should update a task successfully', () => {
      return request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task Title',
          description: 'Updated Description',
          completed: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(taskId);
          expect(res.body.title).toBe('Updated Task Title');
          expect(res.body.description).toBe('Updated Description');
          expect(res.body.completed).toBe(true);
        });
    });

    it('should update only title', () => {
      return request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Only Title Updated',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Only Title Updated');
        });
    });

    it('should update only description', () => {
      return request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Only Description Updated',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.description).toBe('Only Description Updated');
        });
    });

    it('should update only completed status', () => {
      return request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completed: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.completed).toBe(false);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Title',
        })
        .expect(401);
    });

    it('should fail for non-existent task', () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(404);
    });

    it('should fail when updating another users task', async () => {
      const otherTaskResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Other user task to update',
        });

      const otherTaskId = otherTaskResponse.body.id;

      return request(app.getHttpServer())
        .put(`/api/tasks/${otherTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Trying to update',
        })
        .expect(403);
    });

    it('should fail with empty title', () => {
      return request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
        })
        .expect(400);
    });
  });

  describe('/api/tasks/:id/toggle (PATCH)', () => {
    it('should toggle task completion status', async () => {
      // Get current status
      const currentTask = await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const currentStatus = currentTask.body.completed;

      // Toggle
      const toggleResponse = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(toggleResponse.body.completed).toBe(!currentStatus);
    });

    it('should toggle from false to true', async () => {
      // Ensure task is not completed
      await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: false });

      // Toggle to true
      return request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.completed).toBe(true);
        });
    });

    it('should toggle from true to false', async () => {
      // Ensure task is completed
      await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true });

      // Toggle to false
      return request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.completed).toBe(false);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}/toggle`)
        .expect(401);
    });

    it('should fail for non-existent task', () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .patch(`/api/tasks/${fakeId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail when toggling another users task', async () => {
      const otherTaskResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Other user task to toggle',
        });

      const otherTaskId = otherTaskResponse.body.id;

      return request(app.getHttpServer())
        .patch(`/api/tasks/${otherTaskId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('/api/tasks/:id (DELETE)', () => {
    let taskToDelete: string;

    beforeEach(async () => {
      // Create a task to delete
      const response = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to delete',
        });

      taskToDelete = response.body.id;
    });

    it('should delete a task successfully', () => {
      return request(app.getHttpServer())
        .delete(`/api/tasks/${taskToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('eliminada');
        });
    });

    it('should not find deleted task', async () => {
      // Delete task
      await request(app.getHttpServer())
        .delete(`/api/tasks/${taskToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to get deleted task
      return request(app.getHttpServer())
        .get(`/api/tasks/${taskToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/tasks/${taskToDelete}`)
        .expect(401);
    });

    it('should fail for non-existent task', () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail when deleting another users task', async () => {
      const otherTaskResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Other user task to delete',
        });

      const otherTaskId = otherTaskResponse.body.id;

      return request(app.getHttpServer())
        .delete(`/api/tasks/${otherTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should fail to delete same task twice', async () => {
      // Delete once
      await request(app.getHttpServer())
        .delete(`/api/tasks/${taskToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to delete again
      return request(app.getHttpServer())
        .delete(`/api/tasks/${taskToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/api/tasks/stats (GET)', () => {
    beforeAll(async () => {
      // Create tasks with different statuses
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Pending task 1', completed: false });

      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Pending task 2', completed: false });

      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Completed task 1', completed: true });
    });

    it('should get task statistics', () => {
      return request(app.getHttpServer())
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('completed');
          expect(res.body).toHaveProperty('pending');
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.completed).toBe('number');
          expect(typeof res.body.pending).toBe('number');
          expect(res.body.total).toBe(
            res.body.completed + res.body.pending,
          );
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/api/tasks/stats').expect(401);
    });

    it('should return correct counts', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.completed).toBeGreaterThan(0);
      expect(response.body.pending).toBeGreaterThan(0);
    });

    it('should only count users own tasks', async () => {
      // Get stats for main user
      const mainUserStats = await request(app.getHttpServer())
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Get stats for other user
      const otherUserStats = await request(app.getHttpServer())
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      // They should be different
      expect(mainUserStats.body.total).not.toBe(otherUserStats.body.total);
    });
  });

  describe('Task Ownership and Security', () => {
    it('should only allow owner to perform all operations', async () => {
      // Create task with user 1
      const taskResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Ownership test task' });

      const privateTaskId = taskResponse.body.id;

      // User 2 cannot read
      await request(app.getHttpServer())
        .get(`/api/tasks/${privateTaskId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      // User 2 cannot update
      await request(app.getHttpServer())
        .put(`/api/tasks/${privateTaskId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Trying to update' })
        .expect(403);

      // User 2 cannot toggle
      await request(app.getHttpServer())
        .patch(`/api/tasks/${privateTaskId}/toggle`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      // User 2 cannot delete
      await request(app.getHttpServer())
        .delete(`/api/tasks/${privateTaskId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      // But user 1 can still access
      await request(app.getHttpServer())
        .get(`/api/tasks/${privateTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});

