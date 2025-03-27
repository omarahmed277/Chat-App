const User = require('../models/User');
const { validateUpdate } = require('../utils/validators');
const bcrypt = require('bcrypt');

exports.updateUser = async (req, res) => {
  try {
    const { error } = validateUpdate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: error.details[0].message 
      });
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body
      },
      { new: true }
    ).select('-password');

    res.json({ 
      message: 'User updated successfully', 
      data: updatedUser 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ 
      message: 'Users fetched successfully', 
      data: users 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    res.json({ 
      message: 'User fetched successfully', 
      data: user 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    res.json({ 
      message: 'User deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
};