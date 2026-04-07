# Slime Command Reference

This file summarizes the main commands, in-chat instructions, and common configuration for the current Slime CLI application.

## Quick Start

Build first:

```bash
npm install
npm run build
```

Run the default interactive chat:

```bash
node dist/index.js
```

Or, if the package has been linked globally:

```bash
slime
```

## Main CLI Commands

### `slime`

Start the default interactive chat session.

Examples:

```bash
node dist/index.js
node dist/index.js -s code-review
```

Options:

- `-s, --skill <name>`: bind one skill before entering chat

### `slime chat`

Start a chat session explicitly.

Examples:

```bash
node dist/index.js chat
node dist/index.js chat -m "你好"
node dist/index.js chat -s translate
```

Options:

- `-i, --interactive`: use interactive mode
- `-m, --message <message>`: send a single message and exit
- `-s, --skill <name>`: bind a skill for this session

Notes:

- `chat` without `-m` is multi-turn inside the current process
- `chat -m` is single-turn and does not remember previous runs

### `slime config`

Open interactive model configuration.

Example:

```bash
node dist/index.js config
```

Current interactive fields:

- provider
- API URL
- API key
- model
- temperature

The local config file is stored at:

```bash
~/.slime/config.json
```

If the home directory is not writable, the app falls back to:

```bash
.slime/config.json
```

### `slime dashboard`

Start the local dashboard service.

Examples:

```bash
node dist/index.js dashboard
node dist/index.js dashboard --port 3900
```

Options:

- `-p, --port <port>`: dashboard port, default `3800`

### `slime feishu`

Start the Feishu bot bridge.

Example:

```bash
node dist/index.js feishu
```

Required configuration:

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`

Optional configuration:

- `FEISHU_BOT_OPEN_ID`
- `FEISHU_BOT_ALIASES`

### `slime catscompany`

Start the CatsCompany bot bridge.

Example:

```bash
node dist/index.js catscompany
```

Required configuration:

- `CATSCOMPANY_SERVER_URL`
- `CATSCOMPANY_API_KEY`

Optional configuration:

- `CATSCOMPANY_HTTP_BASE_URL`

### `slime weixin`

Start the Weixin bot bridge.

Example:

```bash
node dist/index.js weixin
```

Required configuration:

- `WEIXIN_TOKEN`

Optional configuration:

- `WEIXIN_BASE_URL`
- `WEIXIN_CDN_BASE_URL`

## Skill Commands

### `slime skill list`

List all available skills.

```bash
node dist/index.js skill list
```

### `slime skill info <name>`

Show details for one skill.

```bash
node dist/index.js skill info code-review
```

### `slime skill install <package>`

Install a skill package from npm. If the package name does not contain a scope, Slime auto-expands it to `@slime-skills/<name>`.

```bash
node dist/index.js skill install code-review
node dist/index.js skill install @slime-skills/code-review
```

Options:

- `-g, --global`: install globally

### `slime skill install-github <owner/repo>`

Clone a skill repo from GitHub into the local skills directory.

```bash
node dist/index.js skill install-github yourname/your-skill-repo
```

### `slime skill remove <name>`

Remove a local skill directory.

```bash
node dist/index.js skill remove code-review
```

Options:

- `-f, --force`: remove without prompt
- `--npm`: uninstall as an npm package instead of deleting the local skill folder

## Interactive Chat Commands

These commands work inside `slime` or `slime chat` interactive mode:

- `/exit`: exit the current interactive session
- `exit`: same as `/exit`
- `quit`: same as `/exit`
- `/clear`: clear current conversation history but keep system prompts
- `/history`: print current visible message history

## Bot Session Slash Commands

These commands are handled by the session layer used in message-style platforms such as Feishu and CatsCompany.

- `/clear`: clear session history
- `/history`: show session history summary
- `/skills`: list user-invocable skills
- `/exit`: summarize and close the current session

There is also dynamic skill invocation:

- `/<skill-name>`
- `/<skill-name> <arguments>`

Example:

```text
/translate hello world
```

If the skill supports user invocation, it will be activated for that session.

## Model Provider Configuration

Current built-in providers:

- `openai`
- `anthropic`
- `deepseek`
- `minimax`

Recommended environment variables:

```env
GAUZ_LLM_PROVIDER=openai
GAUZ_LLM_API_KEY=your_key
GAUZ_LLM_API_BASE=https://api.openai.com/v1/chat/completions
GAUZ_LLM_MODEL=gpt-4o-mini
```

DeepSeek example:

```env
GAUZ_LLM_PROVIDER=deepseek
GAUZ_LLM_API_KEY=your_key
GAUZ_LLM_API_BASE=https://api.deepseek.com/v1
GAUZ_LLM_MODEL=deepseek-chat
```

MiniMax example:

```env
GAUZ_LLM_PROVIDER=minimax
GAUZ_LLM_API_KEY=your_key
GAUZ_LLM_API_BASE=https://api.minimaxi.com/v1
GAUZ_LLM_MODEL=MiniMax-M2.7
```

Anthropic example:

```env
GAUZ_LLM_PROVIDER=anthropic
GAUZ_LLM_API_KEY=your_key
GAUZ_LLM_API_BASE=https://api.anthropic.com/v1/messages
GAUZ_LLM_MODEL=claude-3-5-sonnet-latest
```

Important notes:

- For OpenAI-compatible providers, Slime accepts either a full `/chat/completions` URL or a base URL ending in `/v1`
- `chat -m` is single-turn
- interactive `chat` keeps in-memory context while the process stays open

## Other Common Environment Variables

General:

- `SLIME_CONFIG_DIR`: override the config directory
- `DOTENV_CONFIG_PATH`: load env vars from a custom env file

Feishu:

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_BOT_OPEN_ID`
- `FEISHU_BOT_ALIASES`

CatsCompany:

- `CATSCOMPANY_SERVER_URL`
- `CATSCOMPANY_API_KEY`
- `CATSCOMPANY_HTTP_BASE_URL`

Weixin:

- `WEIXIN_TOKEN`
- `WEIXIN_BASE_URL`
- `WEIXIN_CDN_BASE_URL`

Log upload:

- `LOG_UPLOAD_ENABLED`
- `LOG_UPLOAD_SERVER_URL`
- `LOG_UPLOAD_INTERVAL_MINUTES`

## Suggested Test Commands

Basic help:

```bash
node dist/index.js --help
```

Single-turn chat:

```bash
node dist/index.js chat -m "你好"
```

Interactive chat:

```bash
node dist/index.js chat
```

List skills:

```bash
node dist/index.js skill list
```

Start dashboard:

```bash
node dist/index.js dashboard
```
