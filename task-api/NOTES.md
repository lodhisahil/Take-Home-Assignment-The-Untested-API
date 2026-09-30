# Implementation Notes

## What I'd Test Next If I Had More Time

If I had more time, I would add tests for:

* Invalid pagination values such as negative page numbers or invalid limits.
* Additional boundary cases for `dueDate`.
* Different combinations of task status and priority.
* Reassigning a task that already has an assignee.
* Malformed request bodies and unexpected input fields.
* Additional error-handling scenarios.
* Concurrent requests that modify the same task.

## What Surprised Me in the Codebase

The main surprise was that the basic API functionality worked correctly, but several edge cases exposed unexpected behavior.

The status filter used partial string matching, which meant that a value such as `progress` could incorrectly match the valid status `in_progress`.

The pagination logic also had an offset issue because page numbers were expected to be 1-based, while the implementation calculated the offset as `page * limit`.

Another issue was that completing a task unexpectedly changed its priority to `medium`. This behavior was unrelated to completing the task and was identified through a test that verified existing task data should be preserved.

These issues showed the importance of testing edge cases and actual API behavior instead of only testing the main happy paths.

## Questions I'd Ask Before Shipping This to Production

Before shipping this API to production, I would clarify:

1. Should the `assignee` field store a user's name or a unique user ID?
2. Should an already assigned task be allowed to be reassigned?
3. What authentication and authorization rules should apply to task operations?
4. What validation rules should apply to pagination parameters such as `page` and `limit`?
5. Should task data be persisted in a database instead of the current in-memory store?
6. What error response format and HTTP status-code conventions should be standardized?
7. Are rate limiting and other API security requirements needed?
8. What logging, monitoring, and alerting should be configured before production?
