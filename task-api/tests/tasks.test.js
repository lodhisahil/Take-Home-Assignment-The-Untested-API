const request = require("supertest");
const app = require("../src/app");
const taskService = require("../src/services/taskService");

describe("Task API - POST /tasks", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should create a new task", async () => {
    const response = await request(app).post("/tasks").send({
      title: "Write integration tests",
      priority: "high",
    });

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe("Write integration tests");
    expect(response.body.priority).toBe("high");
    expect(response.body.status).toBe("todo");
  });

  test("should return 400 when title is missing", async () => {
    const response = await request(app).post("/tasks").send({
      priority: "high",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "title is required and must be a non-empty string",
    );
  });
  test("should return 400 when status is invalid", async () => {
    const response = await request(app).post("/tasks").send({
      title: "Test invalid status",
      status: "pending",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "status must be one of: todo, in_progress, done",
    );
  });
  test("should return all tasks", async () => {
    await request(app).post("/tasks").send({
      title: "Task 1",
    });

    await request(app).post("/tasks").send({
      title: "Task 2",
    });

    const response = await request(app).get("/tasks");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe("Task 1");
    expect(response.body[1].title).toBe("Task 2");
  });
  test("should return tasks filtered by status", async () => {
    await request(app).post("/tasks").send({
      title: "Todo Task",
      status: "todo",
    });

    await request(app).post("/tasks").send({
      title: "In Progress Task",
      status: "in_progress",
    });

    const response = await request(app).get("/tasks?status=todo");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe("Todo Task");
    expect(response.body[0].status).toBe("todo");
  });
  test("should not return tasks when status filter is only a partial match", async () => {
    await request(app).post("/tasks").send({
      title: "In Progress Task",
      status: "in_progress",
    });

    const response = await request(app).get("/tasks?status=progress");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });

  test("should return the first page of tasks correctly", async () => {
    await request(app).post("/tasks").send({
      title: "Task 1",
    });

    await request(app).post("/tasks").send({
      title: "Task 2",
    });

    await request(app).post("/tasks").send({
      title: "Task 3",
    });

    const response = await request(app).get("/tasks?page=1&limit=2");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe("Task 1");
    expect(response.body[1].title).toBe("Task 2");
  });
  test("should return the second page of tasks correctly", async () => {
    await request(app).post("/tasks").send({
      title: "Task 1",
    });

    await request(app).post("/tasks").send({
      title: "Task 2",
    });

    await request(app).post("/tasks").send({
      title: "Task 3",
    });

    await request(app).post("/tasks").send({
      title: "Task 4",
    });

    const response = await request(app).get("/tasks?page=2&limit=2");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe("Task 3");
    expect(response.body[1].title).toBe("Task 4");
  });
  test("should use default limit when limit is not provided", async () => {
    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post("/tasks")
        .send({
          title: `Task ${i}`,
        });
    }

    const response = await request(app).get("/tasks?page=1");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
  });
  test("should handle page 0 correctly", async () => {
    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post("/tasks")
        .send({
          title: `Task ${i}`,
        });
    }

    const response = await request(app).get("/tasks?page=0&limit=2");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe("Task 1");
    expect(response.body[1].title).toBe("Task 2");
  });
  test("should return 400 when priority is invalid", async () => {
    const response = await request(app).post("/tasks").send({
      title: "Invalid priority task",
      priority: "urgent",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "priority must be one of: low, medium, high",
    );
  });

  test("should return 400 when title contains only whitespace", async () => {
    const response = await request(app).post("/tasks").send({
      title: "   ",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "title is required and must be a non-empty string",
    );
  });

  test("should return 400 when dueDate is invalid", async () => {
    const response = await request(app).post("/tasks").send({
      title: "Invalid date task",
      dueDate: "not-a-date",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("dueDate must be a valid ISO date string");
  });
});

describe("Task API - PUT /tasks/:id", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should update an existing task", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Old Title",
      priority: "low",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).put(`/tasks/${taskId}`).send({
      title: "Updated Title",
      priority: "high",
    });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.title).toBe("Updated Title");
    expect(response.body.priority).toBe("high");
  });

  test("should return 404 when task does not exist", async () => {
    const response = await request(app).put("/tasks/non-existing-id").send({
      title: "Updated Title",
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

  test("should return 400 when updating with an invalid status", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Test Task",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).put(`/tasks/${taskId}`).send({
      status: "pending",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "status must be one of: todo, in_progress, done",
    );
  });

  test("should return 400 when updating with a whitespace-only title", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Original Title",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).put(`/tasks/${taskId}`).send({
      title: "   ",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("title must be a non-empty string");
  });

  test("should return 400 when updating with an invalid priority", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Test Task",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).put(`/tasks/${taskId}`).send({
      priority: "urgent",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "priority must be one of: low, medium, high",
    );
  });

  test("should return 400 when updating with an invalid dueDate", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Test Task",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).put(`/tasks/${taskId}`).send({
      dueDate: "not-a-date",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("dueDate must be a valid ISO date string");
  });
});

describe("Task API - DELETE /tasks/:id", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should delete an existing task", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Task to delete",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).delete(`/tasks/${taskId}`);

    expect(response.status).toBe(204);

    const getResponse = await request(app).get("/tasks");

    expect(getResponse.body).toHaveLength(0);
  });

  test("should return 404 when task does not exist", async () => {
    const response = await request(app).delete("/tasks/non-existing-id");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });
});

describe("Task API - PATCH /tasks/:id/complete", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should complete an existing task", async () => {
    const createResponse = await request(app).post("/tasks").send({
      title: "Complete this task",
      priority: "high",
    });

    const taskId = createResponse.body.id;

    const response = await request(app).patch(`/tasks/${taskId}/complete`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.status).toBe("done");
    expect(response.body.completedAt).not.toBeNull();
  });

  test("should return 404 when task does not exist", async () => {
    const response = await request(app).patch(
      "/tasks/non-existing-id/complete",
    );

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

});

describe("Task API - PATCH /tasks/:id/assign", () => {

  test("should assign a task to an assignee", async () => {
    const createResponse = await request(app)
      .post("/tasks")
      .send({
        title: "Task to Assign",
        priority: "high",
      });

    const taskId = createResponse.body.id;

    const response = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({
        assignee: "Sahil",
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(taskId);
    expect(response.body.assignee).toBe("Sahil");
    expect(response.body.priority).toBe("high");
  });

  test("should return 404 when assigning a non-existent task", async () => {
    const response = await request(app)
      .patch("/tasks/non-existent-id/assign")
      .send({
        assignee: "Sahil",
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

  test("should return 400 when assignee is missing", async () => {
  const createResponse = await request(app)
    .post("/tasks")
    .send({
      title: "Task Without Assignee",
    });

  const taskId = createResponse.body.id;

  const response = await request(app)
    .patch(`/tasks/${taskId}/assign`)
    .send({});

  expect(response.status).toBe(400);
  expect(response.body.error).toBe("assignee is required");
});

test("should return 400 when assignee is empty", async () => {
  const createResponse = await request(app)
    .post("/tasks")
    .send({
      title: "Task With Empty Assignee",
    });

  const taskId = createResponse.body.id;

  const response = await request(app)
    .patch(`/tasks/${taskId}/assign`)
    .send({
      assignee: "",
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe("assignee is required");
});

});

describe("Task API - GET /tasks/stats", () => {
  beforeEach(() => {
    taskService._reset();
  });

  test("should return correct task statistics", async () => {
    await request(app).post("/tasks").send({
      title: "Todo Task",
      status: "todo",
    });

    await request(app).post("/tasks").send({
      title: "In Progress Task",
      status: "in_progress",
    });

    await request(app).post("/tasks").send({
      title: "Done Task",
      status: "done",
    });

    const response = await request(app).get("/tasks/stats");

    expect(response.status).toBe(200);
    expect(response.body.todo).toBe(1);
    expect(response.body.in_progress).toBe(1);
    expect(response.body.done).toBe(1);
    expect(response.body.overdue).toBe(0);
  });

  test("should count overdue incomplete tasks", async () => {
    await request(app).post("/tasks").send({
      title: "Overdue Todo Task",
      status: "todo",
      dueDate: "2020-01-01T00:00:00.000Z",
    });

    await request(app).post("/tasks").send({
      title: "Overdue In Progress Task",
      status: "in_progress",
      dueDate: "2020-01-01T00:00:00.000Z",
    });

    await request(app).post("/tasks").send({
      title: "Completed Old Task",
      status: "done",
      dueDate: "2020-01-01T00:00:00.000Z",
    });

    const response = await request(app).get("/tasks/stats");

    expect(response.status).toBe(200);
    expect(response.body.todo).toBe(1);
    expect(response.body.in_progress).toBe(1);
    expect(response.body.done).toBe(1);
    expect(response.body.overdue).toBe(2);
  });

  test("should return an empty array when there are no tasks", async () => {
    const response = await request(app).get("/tasks");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("should return an empty array when no task matches the status", async () => {
    await request(app).post("/tasks").send({
      title: "Todo Task",
      status: "todo",
    });

    const response = await request(app).get("/tasks?status=done");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("should return tasks with done status", async () => {
    await request(app).post("/tasks").send({
      title: "Completed Task",
      status: "done",
    });

    await request(app).post("/tasks").send({
      title: "Todo Task",
      status: "todo",
    });

    const response = await request(app).get("/tasks?status=done");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe("Completed Task");
    expect(response.body[0].status).toBe("done");
  });
});
