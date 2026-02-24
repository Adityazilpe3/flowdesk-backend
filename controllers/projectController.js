const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get all projects in organization (with completion %)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ organizationId: req.user.organizationId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        // Calculate completion % for each project server-side
        const projectsWithStats = await Promise.all(
            projects.map(async (project) => {
                const totalTasks = await Task.countDocuments({ projectId: project._id });
                const doneTasks = await Task.countDocuments({ projectId: project._id, status: 'Done' });
                const completionPercentage =
                    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

                return {
                    ...project.toObject(),
                    totalTasks,
                    doneTasks,
                    completionPercentage,
                };
            })
        );

        res.json(projectsWithStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create project (Admin only)
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        const project = await Project.create({
            name,
            description,
            organizationId: req.user.organizationId,
            createdBy: req.user._id,
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        }).populate('createdBy', 'name email');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const totalTasks = await Task.countDocuments({ projectId: project._id });
        const doneTasks = await Task.countDocuments({ projectId: project._id, status: 'Done' });
        const completionPercentage =
            totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

        res.json({ ...project.toObject(), totalTasks, doneTasks, completionPercentage });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete project (Admin only)
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Delete all tasks under this project
        await Task.deleteMany({ projectId: project._id });
        await project.deleteOne();

        res.json({ message: 'Project and its tasks deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getProjects, createProject, getProjectById, deleteProject };
