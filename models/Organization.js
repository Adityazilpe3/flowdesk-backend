const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Organization name is required'],
            unique: true,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
