# NoReplyUI5's Revenge Next Plugins

A collection of plugins for the [Revenge Next](https://revenge-mod.github.io/) Discord mobile client.

## Available Plugins

| Plugin | Description |
|--------|-------------|
| **Bluetooth Audio Fix** | Prevents Discord from switching to handsfree (HFP) mode during calls by patching the native audio manager. |
| **Copy Proxy Link** | Adds a "Copy Proxy Link" button to the message action sheet when a message has an attachment or embed with a proxy URL. |
| **FavouriteAnything** | Favourite any image or video, not just GIFs. Adds the favourite button to all media in the image viewer. |
| **HypeSquad Switcher** | Switch your HypeSquad house from settings. |
| **UserBG** | Custom user profile backgrounds via usrbg. |

## Installation

1. Open Discord Settings → Plugins
2. Click the gear icon
3. Paste the repository URL: `http://localhost:3000` (or your hosted URL)
4. Install and enable plugins

## Development

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Node.js >= 22

### Setup

```bash
bun install
```

### Building

```bash
# Build all plugins
bun run build

# Build with dev mode
bun run build:dev
```

### Serve locally

```bash
bun run serve
```

### Generate index

```bash
bun run generate-index
```

## Plugin Structure

Each plugin follows this structure:

```
plugins/
└── plugin-name/
    ├── manifest.json    # Plugin metadata
    └── js/
        └── index.ts     # Plugin source (TypeScript)
```

## Credits

- [Narwhal](https://github.com/nicordev) - Original audio fix concept
- [redstonekasi](https://github.com/kasi07) - Audio manager patching approach
- [revenge-mod](https://github.com/revenge-mod) - Plugin framework and CLI

## License

MIT License - see [LICENSE](LICENSE) for details.
