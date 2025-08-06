class Fiber {
  constructor(name, cableID) {
    this.name = name;
    this.cableID = cableID;
    this.mpoLossLength = [];
    this.fiberInspectors = [];
  }
}
module.exports = Fiber;
