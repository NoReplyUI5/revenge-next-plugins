const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.gifv']
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.tiff']
const processed = new WeakSet<object>()

function isVideo(url: string): boolean {
	if (!url) return false
	const path = url.split('?')[0].toLowerCase()
	return VIDEO_EXT.some(e => path.endsWith(e))
}

function isImage(url: string): boolean {
	if (!url) return false
	const path = url.split('?')[0].toLowerCase()
	return IMAGE_EXT.some(e => path.endsWith(e))
}

function makeVideoThumbnail(url: string): string {
	if (!url) return url
	const out = url.replace('cdn.discordapp.com', 'media.discordapp.net')
	if (out.includes('media.discordapp.net') || out.includes('images-ext')) {
		return out + (out.includes('?') ? '&' : '?') + 'format=jpeg'
	}
	return url
}


function tryPatchModule(
	getModule: () => any,
	doPatch: (mod: any) => (() => void) | null,
	retries = 0,
	maxRetries = 60,
	interval = 500,
): { cancel: () => void } {
	let timeout: ReturnType<typeof setTimeout> | null = null
	let unpatch: (() => void) | null = null
	let cancelled = false

	function attempt() {
		if (cancelled) return
		const mod = getModule()
		if (mod) {
			unpatch = doPatch(mod)
			return
		}
		if (retries++ < maxRetries) {
			timeout = setTimeout(attempt, interval)
		}
	}

	attempt()
	return {
		cancel() {
			cancelled = true
			if (timeout) { clearTimeout(timeout); timeout = null }
			unpatch?.()
		},
	}
}

export default plugin({
	start({ cleanup }) {
		const patches: Array<{ cancel: () => void }> = []

		// Gate 1: isAnimatedImageSource — returns true for any media source with a uri
		patches.push(tryPatchModule(
			() => revenge.modules.finders.lookupModule(revenge.modules.finders.filters.withProps('isAnimatedImageSource'))?.[0],
			(mod) => {
				const orig = mod.isAnimatedImageSource
				mod.isAnimatedImageSource = function (source: any) {
					const url: string = source?.uri || source?.sourceURI || ''
					if (url && (isVideo(url) || isImage(url) || source?.isGIFV)) return true
					return orig.call(this, source)
				}
				console.log('[FavouriteAnything] Patched isAnimatedImageSource')
				return () => { mod.isAnimatedImageSource = orig }
			},
		))

// addFavoriteGIF: set format=2 for videos
		patches.push(tryPatchModule(
			() => revenge.modules.finders.lookupModule(revenge.modules.finders.filters.withProps('addFavoriteGIF'))?.[0],
			(mod) => revenge.patcher.before(mod, 'addFavoriteGIF', (args: any[]) => {
				const data = args[0]
				if (data && typeof data === 'object') {
					const url: string = data.url || data.src || ''
					if (isVideo(url)) data.format = 2
					else if (data.format === 2) data.format = 1
				}
				return args
			}),
		))

		// useFavoriteGIFsMobile: fix video thumbnail URLs for the picker
		patches.push(tryPatchModule(
			() => revenge.modules.finders.lookupModule(revenge.modules.finders.filters.withProps('useFavoriteGIFsMobile'))?.[0],
			(mod) => {
				let lastFavs: any = null
				return revenge.patcher.after(mod, 'useFavoriteGIFsMobile', (_args: any[], result: any) => {
					if (result?.favorites && Array.isArray(result.favorites) && result.favorites !== lastFavs) {
						lastFavs = result.favorites
						for (const item of result.favorites) {
							if (!item || processed.has(item)) continue
							processed.add(item)
							if (isVideo(item.url) || isVideo(item.src)) {
								item.src = makeVideoThumbnail(item.src || item.url)
							}
						}
					}
					return result
				})
			},
		))

		cleanup(() => { for (const p of patches) p.cancel() })
	},
})
