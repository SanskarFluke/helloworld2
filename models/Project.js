class Project {
  constructor(name, organisation) {
    this.name = name;
    this.organisation = organisation;
    this.subprojects = [];
  }
}
module.exports = Project;
