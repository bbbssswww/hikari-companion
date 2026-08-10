# Hikari Companion

> An open-source desktop AI companion whose identity belongs to the user and whose abilities grow with the community.

[中文](./README.md) · [Roadmap](./ROADMAP.md) · [Contributing](./CONTRIBUTING.md) · [Architecture](./docs/architecture.md)

Hikari is not a predefined character. It is a platform for creating a personal companion: upload an appearance, define its personality and relationship, choose an online or local model, and interact through text and voice. The long-term goal is a user-owned personal agent with memory, screen awareness, tools, and cross-device presence.

## Project status

Hikari is currently a **v0.1 prototype**. The repository includes:

- An Electron-based Windows desktop foundation
- A first-run character creation flow
- Local PNG, JPG, and WebP avatar import
- User-defined identity, personality, backstory, and relationship
- Text chat, speech synthesis, and optional speech recognition
- Demo mode and OpenAI-compatible online/local model endpoints
- Local, user-editable long-term memory
- Full-window and transparent desktop companion modes
- A permission model that requires confirmation for dangerous actions
- Windows installer configuration

Live2D, VRM, automatic memory summarization, screen awareness, and tool plugins remain future milestones.

## Quick start

Node.js 24+ and pnpm 11+ are required.

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Build the Windows installer:

```bash
pnpm dist:win
```

## Principles

1. **The character belongs to the user.** No mandatory appearance, gender, voice, or relationship.
2. **Local first.** Character data and memories stay on the user's device by default.
3. **Model agnostic.** Online and local providers share a replaceable interface.
4. **Permission based.** Destructive, financial, publishing, account, and privilege actions require explicit confirmation.
5. **Open to extension.** Avatars, voices, memories, models, and tools will become plugin surfaces.

## Contributing

Developers, artists, Live2D/3D creators, voice engineers, designers, testers, and writers are all welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) and browse the [starter issue backlog](./docs/initial-issues.md).

## License

Source code is licensed under the [MIT License](./LICENSE). Character models, artwork, voices, and other user-provided assets retain their own licenses and must only be shared with permission.
