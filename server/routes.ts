import { Router } from 'express';

import { createMemory, getMemory, updateMemory, deleteMemory, listMemories, searchMemories } from './memory-store.js';

export const memoryRouter = Router();

// GET /api/memories?search=foo&tags=tag1:abc,tag2:def
// If search is provided, run FTS; otherwise list all memories optionally filtered by tags.
memoryRouter.get("/", (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
  const tagsParam = typeof req.query.tags === "string" ? req.query.tags.trim() : undefined;
  // Parse tags as a comma-separated list, e.g. "tag1:abc,tag2:def" -> ["tag1:abc", "tag2:def"]
  const tags = tagsParam ? tagsParam.split(",").map(tag => tag.trim()).filter(Boolean) : undefined;

  const memories = search ? searchMemories(search) : listMemories(tags);
  res.json(memories);
});

// GET /api/memories/:id - Get a single memory by ID (UUID)
memoryRouter.get("/:id", (req, res) => {
  const memory = getMemory(req.params.id);
  if (!memory) {
    return res.status(404).json({ status: "error", message: "Memory not found" });
  }
  res.json(memory);
})

// POST /api/memories - Create a new memory
// Body: { title: string, content: string, tags?: string[] }
memoryRouter.post("/", (req, res) => {
  if (typeof req.body !== "object" || req.body === null) {
    return res.status(400).json({ status: "error", message: "Request body must be a JSON object" });
  }

  const { title, content, tags } = req.body;

  if (typeof title !== "string" || typeof content !== "string") {
    return res.status(400).json({ status: "error", message: "Title and content are required and must be strings" });
  }

  const memory = createMemory(title.trim(), content.trim(), Array.isArray(tags) ? tags : []);
  res.status(201).json(memory);
});

// PUT /api/memories/:id - Update an existing memory by ID
// Body: { title?: string, content?: string, tags?: string[] }
memoryRouter.put("/:id", (req, res) => {
  if (typeof req.body !== "object" || req.body === null) {
    return res.status(400).json({ status: "error", message: "Request body must be a JSON object" });
  }

  const { title, content, tags } = req.body;

  if (title !== undefined && typeof title !== "string") {
    return res.status(400).json({ status: "error", message: "Title must be a string" });
  }
  if (content !== undefined && typeof content !== "string") {
    return res.status(400).json({ status: "error", message: "Content must be a string" });
  }
  if (tags !== undefined && !Array.isArray(tags)) {
    return res.status(400).json({ status: "error", message: "Tags must be an array of strings" });
  }

  const updates = {
    title: typeof title === "string" ? title.trim() : undefined,
    content: typeof content === "string" ? content.trim() : undefined,
    tags: Array.isArray(tags) ? tags : undefined,
  };

  const updated = updateMemory(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ status: "error", message: "Memory not found" });
  }
  res.json(updated);
});

// DELETE /api/memories/:id - Delete a memory by ID
memoryRouter.delete("/:id", (req, res) => {
  if (typeof req.params === null) {
    return res.status(400).json({ status: "error", message: "Memory ID is required in the URL path" });
  }

  const success = deleteMemory(req.params.id);
  if (!success) {
    return res.status(404).json({ status: "error", message: "Memory not found" });
  }
  res.status(204).send();
});