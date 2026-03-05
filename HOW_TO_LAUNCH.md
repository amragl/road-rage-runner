# How to Launch the Autonomous Build

## Step 1: Place the project files

Copy the entire `road-rage-runner/` folder to wherever you want the project to live, for example:

```bash
cp -r road-rage-runner ~/Projects/road-rage-runner
cd ~/Projects/road-rage-runner
```

## Step 2: Open Claude Code in that directory

```bash
cd ~/Projects/road-rage-runner
claude
```

## Step 3: Paste this prompt

Copy and paste the block below as your first message to Claude Code:

---

```
Read the file AUTONOMOUS_BUILD.md in this project root. This is your execution plan.

Before you begin, also read every file it references:
- CLAUDE.md
- docs/GAME_DESIGN.md
- docs/API_SPEC.md
- docs/CONSTANTS_REFERENCE.md
- docs/PROMPT_PLAN.md

Then execute the AUTONOMOUS_BUILD.md plan from start to finish:

1. Initialise local git repo
2. Create remote repo on GitHub under amragl/road-rage-runner using gh CLI
3. Create develop branch
4. Execute all 12 phases sequentially — for each phase:
   a. Create a phase branch from develop
   b. Implement everything specified for that phase
   c. Run all validations (tsc, lint, build, phase-specific tests)
   d. Fix any failures before proceeding
   e. Commit with descriptive message
   f. Push the branch
   g. Merge into develop
   h. Move to next phase immediately
5. After all 12 phases: merge develop into main, tag v1.0.0, push

Do NOT stop between phases. Do NOT ask for confirmation. Run autonomously until all 12 phases are complete and merged to main.

If you encounter an error you cannot resolve after 3 attempts, document it in TODO.md and continue with the next phase.

Start now.
```

---

## What to Expect

Claude Code will:
- Read all project docs (~2 minutes)
- Set up git + GitHub remote
- Execute 12 phases over approximately 30-60 minutes
- Create ~40-50 files across the project
- Run validations between each phase
- Push 12 phase branches + develop + main to GitHub
- Tag v1.0.0 when complete

## After Completion

1. Go to your Vercel dashboard
2. Import the `amragl/road-rage-runner` repo
3. In project settings → Storage → Create a KV Database and link it
4. Deploy — the game will be live at your Vercel URL

## If Claude Code Hits Context Limits

If the conversation gets too long and Claude Code loses context mid-build, start a new session with:

```
Read AUTONOMOUS_BUILD.md and CLAUDE.md. Check git log and current branch to determine where the previous session left off. Continue from the next incomplete phase. Do not redo completed phases.
```

## If You Want to Skip Certain Phases

Modify the prompt to specify:
```
...Execute phases 01 through 12, but SKIP phases 11 and 12. I will handle polish and deployment manually...
```
