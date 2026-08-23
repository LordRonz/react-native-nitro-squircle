import { NitroModules } from 'react-native-nitro-modules'

import type { SquircleDiagnostics } from './specs/SquircleDiagnostics.nitro'

let diagnostics: SquircleDiagnostics | undefined

/** Debug-build counters used by the example benchmark. Release builds return zeros. */
export function getSquircleDiagnostics(): SquircleDiagnostics {
  diagnostics ??= NitroModules.createHybridObject<SquircleDiagnostics>(
    'SquircleDiagnostics'
  )
  return diagnostics
}
