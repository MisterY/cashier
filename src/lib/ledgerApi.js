import ky from 'ky'
import { settings, SettingKeys } from './Configuration'

/**
 * Used to communicate with Ledger server.
 */
export class LedgerApi {
  constructor() {}

  async init() {
    // Server base url
    this.serverUrl = await settings.get(SettingKeys.syncServerUrl)
  }

  /**
   * Perform a ledger-cli query
   * @param {String} command Ledger command. i.e. "balance assets -b 2022-08-01"
   */
  async query(command) {
    //console.debug('query:', command)

    const url = new URL(`${this.serverUrl}?command=${command}`)
    //var options = null
    const response = await ky(url) //, options)

    if (!response.ok) {
      throw new Error('Error querying the ledger server!', response.Error)
    }

    const result = await response.json()
    return result
  }
}