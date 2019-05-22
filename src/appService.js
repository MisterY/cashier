/*
    Provide service layer for the application.
*/
import db from "./dataStore";
import { Account, Transaction, Posting } from "./model";
// import { Notify } from 'quasar'

class AppService {
  createAccount(name) {
    let acc = new Account();
    acc.name = name;

    return db.accounts.add(acc);
  }

  createTransaction() {
    var tx = new Transaction();
    tx.date = new Date().toISOString().substring(0, 10);

    tx.postings.push(new Posting());
    tx.postings.push(new Posting());

    return tx;
  }

  get db() {
    return db;
  }

  deleteAccount(id) {
    return db.accounts.delete(id);
  }

  /**
   * Delete transaction and related postings.
   * @param {*} id
   */
  deleteTransaction(id) {
    return db.transaction("rw", db.transactions, db.postings, () => {
      // delete transaction record
      db.transactions.filter(tx => tx.id == id).delete();

      // delete postings
      db.postings.filter(value => value.transactionId == id).delete();
    });
  }

  /**
   * Returns all the register transactions as text, 
   * ready to be exported as a file or copied as a string.
   */
  exportTransactions() {
    return db.transactions.orderBy("date").toArray().then(txs => {
      var output = "";

      for (let i = 0; i < txs.length; i++) {
        let tx = txs[i];
        // transaction
        output += tx.date;
        output += ' ' + tx.payee;
        output += '\n';
        // postings
        for (let j = 0; j < tx.postings.length; j++) {
          let p = tx.postings[j];
          if (!p.account) continue;
          
          output += '    ';
          output += p.account == null ? "" : p.account;
          if (p.amount) {
            output += "  ";
            output += p.amount == null ? "" : p.amount;
            output += " ";
            output += p.currency == null ? "" : p.currency;
          }
          output += "\n";
        }
        output += "\n";
      }
      return output;
    });
  }

  loadAccount(id) {
    return db.accounts.get(id);
  }

  /**
   * @returns Collection
   */
  loadAccounts() {
    return db.accounts.orderBy("name");
  }

  /**
   * Load all transactions with postings.
   * Sort by date.
   */
  // loadTransactions() {
  //   return db.transaction("r", db.transactions, db.postings, () => {
  //     // load all transactions
  //     // let x = db.transactions.toCollection().sortBy('date') = array
  //     // let x = db.transactions.orderBy('date') = collection
  //     return db.transactions
  //       .orderBy("date")
  //       .reverse()
  //       .toArray()
  //       .then(array => {
  //         // array.forEach(tx => {
  //         //     // load related postings
  //         //     db.postings.filter(p => p.transactionId == tx.id).toArray()
  //         //         .then(array => {
  //         //             array.forEach(posting => {
  //         //                 tx.postings = tx.postings || []
  //         //                 tx.postings.push(posting)

  //         //                 // return tx
  //         //             })
  //         //             return array
  //         //         })
  //         //     // console.log('6th level')
  //         // })
  //         return array;
  //       });
  //   });
  // }

  /**
   * Load single transaction with postings.
   * @param {int} id Transaction id
   * @returns Transaction with Postings
   */
  loadTransaction(id) {
    return db.transaction("r", db.transactions, db.postings, () => {
      return db.transactions.get(id).then(tx => {
        // todo load postings
        return db.postings
          .where({ transactionId: tx.id })
          .toArray()
          .then(postings => {
            // console.log('posting', postings)
            tx.postings = postings;
            return tx;
          });

        // return tx
      });
    });
  }

  saveAccount(account) {
    return db.accounts.put(account);
  }

  /**
   * Save the transaction to the database.
   * @param {Transaction} tx The transaction object
   */
  saveTransaction(tx) {
    if (tx.id === null) {
      // create a new id for the transaction
      tx.id = new Date().getTime();
      // set transaction id on postings
      for (let i = 0; i < tx.postings.length; i++) {
        tx.postings[i].transactionId = tx.id;
      }
      // tx.postings.forEach(p => p.transactionId == tx.id)
    }

    // save all items in a transaction
    return db.transaction("rw", db.transactions, db.postings, () => {
      db.postings.bulkPut(tx.postings);
      // tx.postings.forEach(posting => {
      //     db.postings.put(posting)
      // })

      return db.transactions.put(tx); // returns the transaction id
    });
  }
}

export default new AppService();
