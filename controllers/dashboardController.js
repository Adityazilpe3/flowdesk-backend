const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get dashboard analytics for current organization
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const now = new Date();

        // ─── All calculations happen server-side ───────────────────────────────
        const totalProjects = await Project.countDocuments({ organizationId: orgId });
        const totalTasks = await Task.countDocuments({ organizationId: orgId });
        const doneTasks = await Task.countDocuments({ organizationId: orgId, status: 'Done' });

        const completedPercentage =
            totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

        // Overdue = dueDate is in the past AND task is not Done
        const overdueTasks = await Task.countDocuments({
            organizationId: orgId,
            status: { $ne: 'Done' },
            dueDate: { $lt: now },
        });

        // Tasks grouped by status
        const statusGroups = await Task.aggregate([
            { $match: { organizationId: orgId } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const tasksByStatus = {
            Backlog: 0,
            Todo: 0,
            'In Progress': 0,
            Done: 0,
        };
        statusGroups.forEach((g) => {
            tasksByStatus[g._id] = g.count;
        });

        // Tasks grouped by priority
        const priorityGroups = await Task.aggregate([
            { $match: { organizationId: orgId } },
            { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]);

        const tasksByPriority = { Low: 0, Medium: 0, High: 0 };
        priorityGroups.forEach((g) => {
            tasksByPriority[g._id] = g.count;
        });

        // Recent 5 tasks
        const recentTasks = await Task.find({ organizationId: orgId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('projectId', 'name')
            .populate('assignedTo', 'name');

        res.json({
            totalProjects,
            totalTasks,
            doneTasks,
            completedPercentage,
            overdueTasks,
            tasksByStatus,
            tasksByPriority,
            recentTasks,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboard };
