interface UserBGData {
	endpoint: string
	bucket: string
	prefix: string
	users: Record<string, string>
}

let bgData: UserBGData | null = null

export async function fetchData(): Promise<UserBGData | null> {
	try {
		const res = await fetch('https://usrbg.is-hardly.online/users', { cache: 'no-store' })
		bgData = await res.json()
		return bgData
	} catch (e) {
		console.error('[userbg] Failed to fetch data', e)
		return null
	}
}

function Settings() {
	const { React } = revenge.react
	const { ScrollView, Linking } = revenge.react.ReactNative
	const { TableRowGroup, TableRow } = (revenge as any).discord?.design?.Design ?? {}

	const [reloading, setReloading] = React.useState(false)
	const [status, setStatus] = React.useState<string | null>(null)

	if (!TableRowGroup || !TableRow) return null

	return React.createElement(
		ScrollView,
		{ contentContainerStyle: { paddingBottom: 40 } },
		React.createElement(
			TableRowGroup,
			{ title: status ?? 'UserBG' },
			React.createElement(TableRow, {
				key: 'project',
				label: 'Official Project',
				onPress: () => Linking.openURL('https://git.is-hardly.online/USRBG/USRBG'),
			}),
			React.createElement(TableRow, {
				key: 'reload',
				label: reloading ? 'Reloading…' : 'Reload DB',
				disabled: reloading,
				onPress: async () => {
					setReloading(true)
					setStatus(null)
					const result = await fetchData()
					setStatus(result ? 'DB reloaded!' : 'Failed to reload DB')
					setReloading(false)
				},
			}),
		),
	)
}

export default plugin({
	start({ cleanup }) {
		fetchData()

		const { filters, lookupModule } = revenge.modules.finders
		const getUserBannerURL = lookupModule(
			filters.withProps('getUserBannerURL'),
		)?.[0]

		if (!getUserBannerURL) {
			console.error('[userbg] getUserBannerURL module not found')
			return
		}

		const original = getUserBannerURL.getUserBannerURL
		getUserBannerURL.getUserBannerURL = (user: any) => {
			if (bgData && user?.banner === undefined) {
				const entry = bgData.users[user?.id]
				if (entry) {
					return `${bgData.endpoint}/${bgData.bucket}/${bgData.prefix}${user.id}?${entry}`
				}
			}
			return original(user)
		}

		cleanup(() => {
			getUserBannerURL.getUserBannerURL = original
		})
	},
	SettingsComponent: Settings,
})
