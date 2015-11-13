var _ = require('underscore');

module.exports = function(values) {
  for(var value in values) {
    if (_.isUndefined(values[value])) {
      return true;
    }
  }
  return false;
};
