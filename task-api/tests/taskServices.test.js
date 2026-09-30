const taskService = require("../src/services/taskService");

describe("Task Service - create()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should create a task with default values", () => {
    const task = taskService.create({
      title: "Write tests",
    });

    expect(task).toHaveProperty("id");
    expect(task.title).toBe("Write tests");
    expect(task.description).toBe("");
    expect(task.status).toBe("todo");
    expect(task.priority).toBe("medium");
    expect(task.dueDate).toBe(null);
    expect(task.completedAt).toBe(null);
    expect(task).toHaveProperty("createdAt");
  });
});

describe("Task Service - findById()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should find a task by its id", () => {
    const task = taskService.create({
      title: "Find this task",
    });

    const result = taskService.findById(task.id);

    expect(result).toEqual(task);
  });

  test("should return undefined when task does not exist", () => {
    const result = taskService.findById("invalid-id");

    expect(result).toBeUndefined();
  });
});

describe("Task Service - getAll()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should return all tasks", () => {
    taskService.create({
      title: "Task 1",
    });

    taskService.create({
      title: "Task 2",
    });

    const result = taskService.getAll();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Task 1");
    expect(result[1].title).toBe("Task 2");
  });

  test("should return an empty array when there are no tasks", () => {
    const result = taskService.getAll();

    expect(result).toEqual([]);
  });
});

describe("Task Service - getByStatus()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should return tasks with the requested status", () => {
    taskService.create({
      title: "Todo Task",
      status: "todo",
    });

    taskService.create({
      title: "In Progress Task",
      status: "in_progress",
    });

    const result = taskService.getByStatus("todo");

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Todo Task");
    expect(result[0].status).toBe("todo");
  });

  test("should return an empty array when no task has the requested status", () => {
    taskService.create({
      title: "Todo Task",
      status: "todo",
    });

    const result = taskService.getByStatus("done");

    expect(result).toEqual([]);
  });
});

describe("Task Service - getPaginated()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should return tasks for the requested page", () => {
    taskService.create({
      title: "Task 1",
    });

    taskService.create({
      title: "Task 2",
    });

    taskService.create({
      title: "Task 3",
    });

    const result = taskService.getPaginated(1, 2);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Task 1");
    expect(result[1].title).toBe("Task 2");
  });

  test("should return an empty array when page has no tasks", () => {
    taskService.create({
      title: "Task 1",
    });

    const result = taskService.getPaginated(5, 2);

    expect(result).toEqual([]);
  });
});

describe("Task Service - getStats()", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should return correct task counts by status", () => {
    taskService.create({
      title: "Todo Task",
      status: "todo",
    });

    taskService.create({
      title: "In Progress Task",
      status: "in_progress",
    });

    taskService.create({
      title: "Done Task",
      status: "done",
    });

    taskService.create({
      title: "Another Todo Task",
      status: "todo",
    });

    const result = taskService.getStats();

    expect(result.todo).toBe(2);
    expect(result.in_progress).toBe(1);
    expect(result.done).toBe(1);
    expect(result.overdue).toBe(0);
  });

  test("should return zero counts when there are no tasks", () => {
    const result = taskService.getStats();

    expect(result.todo).toBe(0);
    expect(result.in_progress).toBe(0);
    expect(result.done).toBe(0);
    expect(result.overdue).toBe(0);
  });

  test("should count overdue incomplete tasks", () => {
    taskService.create({
      title: "Overdue Todo Task",
      status: "todo",
      dueDate: "2020-01-01T00:00:00.000Z",
    });

    taskService.create({
      title: "Overdue In Progress Task",
      status: "in_progress",
      dueDate: "2020-01-01T00:00:00.000Z",
    });

    taskService.create({
      title: "Completed Old Task",
      status: "done",
      dueDate: "2020-01-01T00:00:00.000Z",
    });

    const result = taskService.getStats();

    expect(result.todo).toBe(1);
    expect(result.in_progress).toBe(1);
    expect(result.done).toBe(1);
    expect(result.overdue).toBe(2);
  });
});

describe('Task Service - update()', () => {

    beforeEach(() => {
        taskService._reset();
    });

    test('should update an existing task', () => {
        const task = taskService.create({
            title: 'Old Title',
            priority: 'low'
        });

        const result = taskService.update(task.id, {
            title: 'Updated Title',
            priority: 'high'
        });

        expect(result.title).toBe('Updated Title');
        expect(result.priority).toBe('high');
        expect(result.id).toBe(task.id);
    });

    test('should return null when task does not exist', () => {
        const result = taskService.update('invalid-id', {
            title: 'Updated Title'
        });

        expect(result).toBeNull();
    });

});

describe('Task Service - remove()', () => {

    beforeEach(() => {
        taskService._reset();
    });

    test('should remove an existing task', () => {
        const task = taskService.create({
            title: 'Task to remove'
        });

        const result = taskService.remove(task.id);

        expect(result).toBe(true);
        expect(taskService.findById(task.id)).toBeUndefined();
    });

    test('should return false when task does not exist', () => {
        const result = taskService.remove('invalid-id');

        expect(result).toBe(false);
    });

});

describe('Task Service - completeTask()', () => {

    beforeEach(() => {
        taskService._reset();
    });

    test('should mark an existing task as completed', () => {
        const task = taskService.create({
            title: 'Complete this task',
            status: 'todo',
            priority: 'high'
        });

        const result = taskService.completeTask(task.id);

        expect(result.status).toBe('done');
        expect(result.completedAt).not.toBeNull();
        expect(result.id).toBe(task.id);
    });

    test('should preserve the task priority when completing it', () => {
    const task = taskService.create({
        title: 'High priority task',
        status: 'todo',
        priority: 'high'
    });

    const result = taskService.completeTask(task.id);

    expect(result.priority).toBe('high');
});

    test('should return null when task does not exist', () => {
        const result = taskService.completeTask('invalid-id');

        expect(result).toBeNull();
    });

});