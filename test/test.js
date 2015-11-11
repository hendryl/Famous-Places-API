var expect = require("expect.js");

console.log("------------------------");
console.log("|Mocha test results");
console.log("------------------------");

describe('trial test', function() {
  it('should return true', function() {
    expect(true).to.be(true);
  });
});
