declare function plugin<T>(options: {
	jsonStorage?: { load: boolean; default: T }
	start?: (context: {
		cleanup: (fn: () => void) => void
		jsonStorage: T
		plugin: { startedLate: boolean; requireReload: () => void }
	}) => void
	SettingsComponent?: React.ComponentType
}): void

declare namespace revenge {
	namespace react {
		const ReactNative: {
			TurboModuleRegistry: {
				get(name: string): any
			}
		}
	}
}
