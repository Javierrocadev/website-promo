## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Git workflow

- Divide each substantial task into meaningful, independently verifiable milestones.
- Before implementation, identify the milestones that will produce commits.
- After completing each milestone, run the relevant checks and review both `git status` and the diff.
- Stage only the files changed for that milestone, using explicit paths. Do not use `git add .` or `git add -A`.
- Commit each completed milestone with a descriptive Conventional Commits message.
- For a small task, create one commit after the task is complete and verified.
- Do not create empty commits.
- Do not stage or commit pre-existing changes or changes unrelated to the current task.
- If a file mixes user changes with task changes and they cannot be separated safely, leave it unstaged and explain the issue.
- Do not amend commits, rebase, use destructive resets, force push, or push to a remote unless the user explicitly asks.
- In the final response, list the hashes and messages of every commit created.
