# Mini Memory MCP

This project uses a local persistent memory server. Follow these rules in every session.

## Startup - always do this first

Call `memory_list` at the start of every session before doing any work. This loads all saved context, preferences and decisions.

## Saving, Updating, Searching and Deleting Memories

Use `memory_create`, `memory_update`, `memory_search` and `memory_delete` to manage memories. Always use these tools instead of trying to manage memory yourself.

## Token Efficiency

Memories are stored in compressed shorthand. When reading memories back, interpret abbreviations naturally - DO NOT expand them in your responses unless asked.
