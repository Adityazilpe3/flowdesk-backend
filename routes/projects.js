const express = require('express');
const router = express.Router();
const {
    getProjects,
    createProject,
    getProjectById,
    deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

router.get('/', protect, getProjects);
router.post('/', protect, adminOnly, createProject);
router.get('/:id', protect, getProjectById);
router.delete('/:id', protect, adminOnly, deleteProject);

module.exports = router;
