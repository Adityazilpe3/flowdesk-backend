const Organization = require('../models/Organization');
const User = require('../models/User');

// @desc    Join an existing organization as Member
// @route   POST /api/org/join
// @access  Public (before user exists) - used during register for members
const joinOrg = async (req, res) => {
    try {
        const { name, email, password, orgName } = req.body;

        if (!name || !email || !password || !orgName) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const organization = await Organization.findOne({ name: orgName });
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        const user = await User.create({
            name,
            email,
            password,
            organizationId: organization._id,
            role: 'Member',
        });

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            orgName: organization.name,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all members of the current user's organization
// @route   GET /api/org/members
// @access  Private
const getOrgMembers = async (req, res) => {
    try {
        const members = await User.find({ organizationId: req.user.organizationId }).select('-password');
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { joinOrg, getOrgMembers };
