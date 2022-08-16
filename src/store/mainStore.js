import { defineStore } from 'pinia'
import appService from '../appService'
import { ScheduledTransaction } from 'src/model'
import { CurrentTransactionService } from 'src/lib/currentTransactionService'

export const useMainStore = defineStore('mainStore', {
  /**
   * Initial state.
   * data
   * @returns state
   */
  state: () => ({
    scheduledTx: null,
    tx: null,
  }),

  /**
   * computed
   */
  getters: {
    myItem: (state) => state.tx,
  },

  /**
   * methods
   * Can be asynchronous.
   */
  actions: {
    async loadScheduledTx(id) {
      let schTx = await appService.db.scheduled.get(id)
      if (!schTx) {
        throw new Error('Scheduled transaction not found!', id)
      }

      this.scheduledTx = schTx

      // transaction
      let tx = JSON.parse(schTx.transaction)
      this.setTransaction(tx)

      return schTx
    },
    async loadTx(id) {
      const tx = await appService.loadTransaction(id)
      this.setTransaction(tx)
    },
    newScheduledTx() {
      let newSchTx = new ScheduledTransaction()
      this.scheduledTx = newSchTx
    },
    newTx() {
      const tx = new CurrentTransactionService().createTransaction()
      this.setTransaction(tx)
    },
    setTransaction(tx) {
      this.tx = tx
    },
  },
})
