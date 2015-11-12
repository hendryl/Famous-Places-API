var express = require('express');
var router = express.Router();

// route definitions
router.use('/continents', require('./continents'));
router.use('/countries', require('./countries'));

router.get('/', function(req, res) {
  res.status(200).json({message: "This is the Famous Places API"});
});

module.exports = router;
