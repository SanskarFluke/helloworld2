class User {
  constructor() {
    this.firstName = '';
    this.lastName = '';
    this.companyName = '';
    this.email = '';
    this.password = '';
    this.passwordConfirm = '';
    this.jobRole = '';
    this.address1 = '';
    this.address2 = '';
    this.city = '';
    this.state = '';
    this.phone = '';
    this.country = '';
    this.postalCode = '';
    this.agreeTerms = false;
    this.agreeMarketing = false;
    this.organisations = [];
  }
}
module.exports = User;
