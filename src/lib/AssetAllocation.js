/*
    Asset Allocation
*/
import appService from "../appService";
import AssetClass from "./AssetClass";

/**
 * loadDefinition = loads the pre-set definition
 *
 */
class AssetAllocationEngine {
  constructor() {
    this.assetClassIndex = null;
    this.stockIndex = null;
  }

  async loadFullAssetAllocation() {
    // aa definition

    let assetClasses = await this.loadDefinition();
    this.assetClassIndex = this.buildAssetClassIndex(assetClasses);

    // build the stock index
    this.stockIndex = this.buildStockIndex(assetClasses);

    await this.loadCurrentValues();

    // Sum the balances for groups.
    this.sumGroupBalances(this.assetClassIndex);

    // todo validation, check the allocation for groups, compare to sum of children's

    // calculate offsets
    this.calculateOffsets(this.assetClassIndex);

    // format numbers for output
    this.formatNumbers(this.assetClassIndex);

    // convert to array for display in a table
    let result = Object.values(this.assetClassIndex);

    return result;
  }

  buildAssetClassIndex(assetClasses) {
    let index = {};

    for (let i = 0; i < assetClasses.length; i++) {
      let ac = assetClasses[i];
      index[ac.fullname] = ac;
    }

    return index;
  }

  buildStockIndex(asetClasses) {
    let index = {};

    for (let i = 0; i < asetClasses.length; i++) {
      let assetClass = asetClasses[i];
      if (!assetClass.stocks) continue;

      let stocks = assetClass.stocks;
      for (let j = 0; j < stocks.length; j++) {
        let stock = stocks[j];

        index[stock] = assetClass.fullname;
      }
    }
    return index;
  }

  calculateOffsets(dictionary) {
    let root = dictionary["Allocation"];
    let total = root.currentValue;

    // for each row
    Object.values(dictionary).forEach(ac => {
      // key
      // console.log(key)
      // calculate current allocation
      ac.currentAllocation = ((ac.currentValue * 100) / total).toFixed(2);

      // diff
      ac.diff = (ac.currentAllocation - ac.allocation).toFixed(2);
      // diff %
      ac.diffPerc = ((ac.diff * 100) / ac.allocation).toFixed(2);

      ac.allocatedAmount = ((ac.allocation * total) / 100).toFixed(2);
      // diff amount =
      ac.diffAmount = (ac.currentValue - ac.allocatedAmount).toFixed(2);
    });
  }

  cleanBlankArrayItems(array) {
    let i = 0;
    while (i < array.length) {
      let part = array[i];
      if (part === "") {
        array.splice(i, 1);
      } else {
        i++;
      }
    }
    return array;
  }

  findChildren(dictionary, parent) {
    let children = [];

    Object.values(dictionary).forEach(val => {
      // console.log(key); // the name of the current key.
      // console.log(val); // the value of the current key.
      if (parent.fullname === val.parentName) {
        children.push(val);
      }
    });

    return children;
  }

  formatNumbers(dictionary) {
    let format = new Intl.NumberFormat("en-AU");

    Object.values(dictionary).forEach(ac => {
      // new Intl.NumberFormat("en-AU").format(amount)
      //console.log(ac)
      ac.currentValue = format.format(ac.currentValue);
      ac.allocatedAmount = format.format(ac.allocatedAmount);
      ac.diffAmount = format.format(ac.diffAmount);
    });
  }

    /**
   * Parse and store the current balances ("l b ^Assets:Inv --flat -X EUR")
   * in the allocation object.
   * @param {str} text
   */
  async importCurrentValues(text) {
    // load current allocation
    // let aa = await this.loadDefinition()
    // let accounts = await this.getInvestmentAccounts()
    let currentArray = this.parseCurrentValuesFile(text);

    // assign values
    for (let i = 0; i < currentArray.length; i++) {
      let row = currentArray[i];
      // account name
      let accountName = row[0];
      // balance
      let balance = row[1];
      balance = balance.replace(",", "");
      let currency = row[2];

      // Save to existing accounts
      let account = await appService.db.accounts.get(accountName);
      if (!account) {
        throw "Invalid account " + accountName;
      }
      account.currentValue = balance;
      account.currentCurrency = currency;

      await appService.db.accounts.put(account);
    }
  }

  /**
   * Import Asset Allocation definition.
   * @param {str} text Contents of the definition file.
   * @returns Dictionary of asset classes with allocations and stocks
   */
  importDefinition(text) {
    if (!text) return;

    // parse and save into the storage.
    let assetClasses = [];

    let lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let assetClass = this.parseLine(line);
      if (!assetClass) continue;

      // add to index
      //   index[assetClass.fullname] = assetClass;
      assetClasses.push(assetClass);

      // index stocks
      //   if (assetClass.stocks) {
      //     for (let s = 0; s < assetClass.stocks.length; s++) {
      //       let symbol = assetClass.stocks[s];
      //       stockIndex[symbol] = assetClass.fullname;
      //     }
      //   }
    }

    // persist?
    // stockIndex
    // return index
    // return settings.set(SettingKeys.assetAllocationDefinition, index);
    return appService.db.assetAllocation.bulkPut(assetClasses);
  }

  async loadCurrentValues() {
    // load current balances from accounts
    // add the account balances to asset classes
    let invAccounts = await appService.getInvestmentAccounts();
    await invAccounts.each(account => {
      let amount = parseFloat(account.currentValue);
      // amount = amount.toFixed(2)

      let commodity = account.currency;
      // now get the asset class for this commodity
      let assetClassName = this.stockIndex[commodity];
      let assetClass = this.assetClassIndex[assetClassName];

      if (typeof assetClass.currentValue === "undefined") {
        assetClass.currentValue = 0;
      }
      assetClass.currentValue += amount;
    });
  }

  /**
   * Load the asset allocation definition from persistence.
   * @returns Array of asset class records
   */
  async loadDefinition() {
    return appService.db.assetAllocation.toArray();
  }

  parseCurrentValuesFile(text) {
    let result = [];

    let lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let parts = line.split("  ");
      parts = this.cleanBlankArrayItems(parts);
      if (parts.length < 2) continue;

      let amountParts = parts[0].split(" ");
      amountParts = this.cleanBlankArrayItems(amountParts);

      let amountString = amountParts[0];
      let currency = amountParts[1];
      let accountName = parts[1];

      result.push([accountName, amountString, currency]);
    }

    return result;
  }

  /**
   * Parse one raw line from the definition file.
   * @param {string} line
   * @returns AssetClass instance
   */
  parseLine(line) {
    let parts = this.splitLine(line);
    if (!parts || !parts.length) return;

    let ac = new AssetClass();

    ac.fullname = parts[0];

    ac.allocation = parts[1];

    let stocksLine = null;
    if (parts.length > 2) {
      stocksLine = parts[2];
      ac.stocks = stocksLine.split(" ");
    }

    return ac;
  }

  /**
   * Splits the definition line into sections
   * @param {str} line
   */
  splitLine(line) {
    if (line.startsWith(";")) return;

    // parse line
    line = line.trim();
    // asset class, percentage, symbols
    let parts = line.split("  ");

    // Clean up blank sections
    parts = this.cleanBlankArrayItems(parts);

    return parts;
  }

  sumGroupBalances(acIndex) {
    let root = acIndex["Allocation"];
    let sum = this.sumChildren(acIndex, root);

    root.currentValue = sum;
  }

  sumChildren(dictionary, item) {
    // find all children
    let children = this.findChildren(dictionary, item);
    // console.log(children);
    if (children.length === 0) {
      return item.currentValue;
    }

    let sum = 0;
    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      child.currentValue = this.sumChildren(dictionary, child);

      let amount = child.currentValue;
      sum += amount;
    }

    return sum;
  }
}

export const engine = new AssetAllocationEngine();
