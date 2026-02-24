const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get all tasks in org (with filters)
// @route   GET /api/tasks?status=&priority=&projectId=
// @access  Private
const getTasks = async (req, res) => {
    try {
        const filter = { organizationId: req.user.organizationId };

        if (req.query.status) filter.status = req.query.status;
        if (req.query.priority) filter.priority = req.query.priority;
        if (req.query.projectId) filter.projectId = req.query.projectId;

        const tasks = await Task.find(filter)
            .populate('assignedTo', 'name email')
            .populate('projectId', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        // Mark overdue server-side
        const now = new Date();
        const tasksWithOverdue = tasks.map((task) => ({
            ...task.toObject(),
            isOverdue: task.dueDate && task.dueDate < now && task.status !== 'Done',
        }));

        res.json(tasksWithOverdue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    try {
        const { title, description, status, priority, dueDate, projectId, assignedTo } = req.body;

        if (!title || !projectId) {
            return res.status(400).json({ message: 'Title and projectId are required' });
        }

        // Verify project belongs to this org
        const project = await Project.findOne({
            _id: projectId,
            organizationId: req.user.organizationId,
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found in your organization' });
        }

        const task = await Task.create({
            title,
            description,
            status: status || 'Backlog',
            priority: priority || 'Medium',
            dueDate,
            projectId,
            organizationId: req.user.organizationId,
            assignedTo: assignedTo || null,
            createdBy: req.user._id,
        });

        const populated = await task.populate([
            { path: 'assignedTo', select: 'name email' },
            { path: 'projectId', select: 'name' },
        ]);

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update task (status, priority, etc.)
// @route   PATCH /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const { title, description, status, priority, dueDate, assignedTo } = req.body;

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (status !== undefined) task.status = status;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (assignedTo !== undefined) task.assignedTo = assignedTo;

        const updated = await task.save();
        const populated = await updated.populate([
            { path: 'assignedTo', select: 'name email' },
            { path: 'projectId', select: 'name' },
        ]);

        res.json({
            ...populated.toObject(),
            isOverdue: populated.dueDate && populated.dueDate < new Date() && populated.status !== 'Done',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await task.deleteOne();
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
