let msg = null

function hideSheet() {
	try {
		revenge.discord.actions?.ActionSheetActionCreators?.hideActionSheet?.()
	} catch {}
}

function getProxyUrl(message) {
	return (
		message?.attachments?.[0]?.proxy_url ??
		message?.attachments?.[0]?.proxyURL ??
		message?.embeds?.[0]?.image?.proxy_url ??
		message?.embeds?.[0]?.image?.proxyURL ??
		null
	)
}

function isRowArray(arr) {
	if (arr.length === 0) return false
	const first = arr[0]
	return (
		first?.type?.name === 'ActionSheetRow' ||
		(first?.props && typeof first.props.label === 'string')
	)
}

function walkRows(tree, out = []) {
	if (!tree || typeof tree !== 'object') return out
	if (Array.isArray(tree)) {
		if (isRowArray(tree) && !out.includes(tree)) out.push(tree)
		tree.forEach(c => walkRows(c, out))
		return out
	}
	const k = tree?.props?.children
	if (Array.isArray(k)) {
		if (isRowArray(k) && !out.includes(k)) out.push(k)
		k.forEach(c => walkRows(c, out))
	} else {
		walkRows(k, out)
	}
	return out
}

function makeRow(tpl, label, onPress) {
	const { React } = revenge.react
	const Row = tpl?.type
	if (!Row) return null
	return React.createElement(Row, { key: label, label, onPress })
}

function inject(res) {
	if (!res || !msg?.id) return res
	const proxyUrl = getProxyUrl(msg)
	if (!proxyUrl) return res

	const groups = walkRows(res)
	if (groups.length === 0) return res

	const rowArr = groups[0]
	const tpl = rowArr?.find?.(r => r?.props?.label != null) ?? rowArr?.[0]
	if (!tpl) return res

	const row = makeRow(tpl, 'Copy Proxy Link', () => {
		hideSheet()
		revenge.react.ReactNative.Clipboard.setString(proxyUrl)
		try {
			revenge.discord.actions?.ToastActionCreators?.showToast?.({
				content: 'Proxy link copied!',
			})
		} catch {}
	})
	if (row) rowArr.unshift(row)

	return res
}

function installWrapper(ns) {
	const mod = ns?.default ?? ns
	if (typeof mod !== 'function') return () => {}
	const orig = mod
	const wrapped = props => {
		const res = orig(props)
		try {
			return msg ? inject(res) : res
		} catch {
			return res
		}
	}
	ns.default = wrapped
	return () => {
		if (ns.default === wrapped) ns.default = orig
	}
}

function onImportedPath(path, cb) {
	try {
		return (
			revenge.discord.utils.modules.finders.getModuleWithImportedPath(
				path,
				ns => cb(ns),
			) ?? (() => {})
		)
	} catch {
		return () => {}
	}
}

plugin({
	start({ cleanup }) {
		const unpatch = []

		unpatch.push(
			onImportedPath(
				'modules/action_sheet/native/ActionSheetActionCreators.tsx',
				ns => {
					const owner = ns?.default ?? ns
					if (typeof owner?.openLazy !== 'function') return
					unpatch.push(
						revenge.patcher.before(owner, 'openLazy', args => {
							const [, key, loc] = args ?? []
							msg = key === 'MessageLongPressActionSheet' ? (loc?.message ?? null) : null
							return args
						}),
					)
				},
			),
		)

		unpatch.push(
			onImportedPath(
				'modules/messages/native/long_press/LongPressMessageActionSheet.tsx',
				ns => {
					unpatch.push(installWrapper(ns))
				},
			),
		)

		cleanup(() => {
			for (const u of unpatch) u?.()
			msg = null
		})
	},
})
