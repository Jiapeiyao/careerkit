# Agent modules

This directory reserves space for server-side Agent code in TypeScript.
An Agent uses a language model and tools to complete a task.
No Agent workflow or model connection exists yet.

Future modules will assemble context, extract facts, plan questions, and propose resume changes.
Keep model credentials and calls on the server.
Do not import these modules into client components.

Next.js route handlers must authenticate users before they call Agent modules.
Pass the user identity and project scope from the server, not from conversation text.
Agent output remains a proposal until the user approves it.
Agent modules must not commit business changes or approve their own proposals.

The Agent framework and model provider remain undecided.
