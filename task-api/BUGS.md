# Bug Report

## Bug 1 — Status Filter Performs Partial Matching

### Location

`src/services/taskService.js` → `getByStatus()`

### Status

**Fixed**

### Expected Behavior

The `status` query parameter should match the task status exactly.

For example:

`GET /tasks?status=progress`

should not return a task whose status is `in_progress`, because `progress` is not a valid exact status.

### Actual Behavior

The API returns tasks whose status contains the provided value.

For example:

`in_progress`.includes(`progress`) returns `true`.

Therefore, `GET /tasks?status=progress` incorrectly returns `in_progress` tasks.

### How It Was Discovered

An integration test was written that created an `in_progress` task and requested:

`GET /tasks?status=progress`

The test expected an empty array, but the API returned the `in_progress` task.

### Possible Fix

Use an exact equality check instead of `includes()` when filtering by status.

### Fix Applied

Changed the status filtering logic from partial matching to exact matching:

```js
const getByStatus = (status) => tasks.filter((t) => t.status === status);
```

---

## Bug 2 — Pagination Starts From the Wrong Offset

### Location

`src/services/taskService.js` → `getPaginated()`

### Status

**Fixed**

### Expected Behavior

Pagination should treat page numbers as 1-based.

For example, with 3 tasks:

`GET /tasks?page=1&limit=2`

should return the first two tasks.

### Actual Behavior

The first page skips the first `limit` tasks because the offset is calculated as:

`page * limit`

For page 1 with limit 2, the offset becomes 2 instead of 0.

### How It Was Discovered

An integration test created three tasks and requested:

`GET /tasks?page=1&limit=2`

The test expected the first two tasks, but the API skipped them.

### Possible Fix

Calculate the offset using:

`(page - 1) * limit`

### Fix Applied

Changed the pagination offset calculation to:

```js
const getPaginated = (page, limit) => {
  const offset = (page - 1) * limit;
  return tasks.slice(offset, offset + limit);
};
```

---

## Bug 3 — Completing a Task Unexpectedly Changes Its Priority

### Location

`src/services/taskService.js` → `completeTask()`

### Status

**Fixed**

### Expected Behavior

Completing a task should change its status to `done` while preserving its existing priority.

### Actual Behavior

When a task is completed, its priority is always changed to `medium`, even if it was originally `low` or `high`.

### How It Was Discovered

An automated unit test created a high-priority task, completed it, and expected its priority to remain `high`. The test received `medium`.

### Possible Fix

Remove the `priority: 'medium'` assignment from the updated task object so the existing priority is preserved.

### Fix Applied

Removed the hardcoded priority assignment from `completeTask()`:

```js
const updated = {
  ...task,
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

The existing priority is now preserved when a task is completed.

---

## Verification

All three bugs were verified using automated tests.

**Current test result: 51/51 tests passing.**

**Final coverage:**

* Statements: 97.35%
* Branches: 97.61%
* Functions: 93.10%
* Lines: 97.10%
