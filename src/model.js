/*
    The domain model
*/

export class Account {
    constructor() {
        this.name = null,
        this.balance = null,
        this.currency = null
    }
}

export class Commodity {
    constructor() {
        this.name = null
    }
}

export class Payee {
    constructor() {
        // Remember the last transaction, to fill on selection.
        this.lastTransactionId = null
    }
}

export class Posting {
    constructor() {
        // Id is inserted automatically.
        // this.id = null
        this.transactionId = ""
        this.account = ""
        this.amount = ""
        this.currency = ""
    }
}

export class Transaction {
    constructor() {
        //this.id = newId()
        this.id = null
        this.date = null
        this.payee = ""
        this.postings = []
    }
}

