const express = require('express');
const router = express.Router();
const { joinOrg, getOrgMembers } = require('../controllers/orgController');
const { protect } = require('../middleware/auth');

router.post('/join', joinOrg);
router.get('/members', protect, getOrgMembers);

module.exports = router;
