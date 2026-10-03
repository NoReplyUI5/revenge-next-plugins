const HOUSES = [
	{ id: 1, label: 'Bravery', subLabel: 'House of Bravery' },
	{ id: 2, label: 'Brilliance', subLabel: 'House of Brilliance' },
	{ id: 3, label: 'Balance', subLabel: 'House of Balance' },
	{ id: 0, label: 'Remove Badge', subLabel: 'Remove your HypeSquad badge' },
]

function getHttp(): any {
	return revenge.modules.finders.lookupModule(
		revenge.modules.finders.filters.withProps('getAPIBaseURL', 'get', 'post'),
	)?.[0]
}

async function applyHouse(id: number): Promise<void> {
	const http = getHttp()
	if (!http) throw new Error('HTTP module not found')
	if (id === 0) {
		await http.del({ url: '/hypesquad/online' })
	} else {
		await http.post({ url: '/hypesquad/online', body: { house_id: id }, oldFormErrors: true })
	}
}

function Settings() {
	const { React } = revenge.react
	const { ScrollView } = revenge.react.ReactNative
	const { TableRowGroup, TableRow } = (revenge as any).discord?.design?.Design ?? {}

	const [pending, setPending] = React.useState(false)
	const [status, setStatus] = React.useState<string | null>(null)

	async function select(id: number) {
		if (pending) return
		setPending(true)
		setStatus(null)
		try {
			await applyHouse(id)
			setStatus('Done!')
		} catch (e: any) {
			setStatus(e?.message ?? String(e))
		} finally {
			setPending(false)
		}
	}

	if (!TableRowGroup || !TableRow) return null

	return React.createElement(
		ScrollView,
		{ contentContainerStyle: { paddingBottom: 40 } },
		React.createElement(
			TableRowGroup,
			{ title: status ? `Choose Your House — ${status}` : 'Choose Your House' },
			...HOUSES.map(house =>
				React.createElement(TableRow, {
					key: house.id,
					label: house.label,
					subLabel: house.subLabel,
					disabled: pending,
					onPress: () => select(house.id),
				}),
			),
		),
	)
}

export default plugin({
	start({ cleanup }) {
		cleanup(() => {})
	},
	SettingsComponent: Settings,
})
