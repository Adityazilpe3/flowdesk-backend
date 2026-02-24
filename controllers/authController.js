const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

// @desc    Register user + create organization
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, orgName } = req.body;

        if (!name || !email || !password || !orgName) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create organization
        const orgExists = await Organization.findOne({ name: orgName });
        if (orgExists) {
            return res.status(400).json({ message: 'Organization name already taken' });
        }

        const organization = await Organization.create({ name: orgName });

        // Create user as Admin
        const user = await User.create({
            name,
            email,
            password,
            organizationId: organization._id,
            role: 'Admin',
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            orgName: organization.name,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email }).populate('organizationId', 'name');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId._id,
            orgName: user.organizationId.name,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('organizationId', 'name');
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId._id,
            orgName: user.organizationId.name,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, login, getMe };
