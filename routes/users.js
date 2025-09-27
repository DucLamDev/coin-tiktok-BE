const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});


// @route   GET /api/users/search/:tiktokId
// @desc    Search user by TikTok ID
// @access  Private
router.get('/search/:tiktokId', auth, async (req, res) => {
  try {
    const { tiktokId } = req.params;

    const user = await User.findOne({ tiktokId, isActive: true })
      .select('username tiktokId avatar coinBalance');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        username: user.username,
        tiktokId: user.tiktokId,
        avatar: user.avatar,
        exists: true
      }
    });
  } catch (error) {
    console.error('Search user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get the file path relative to server
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user's avatar in database
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true } // Return the updated document
    ).select('-password'); // Exclude password from the result

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      user: user // Return the full updated user object
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9._]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and periods'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('fullName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Full name must be less than 100 characters'),
  body('bio')
    .optional()
    .isLength({ max: 80 })
    .withMessage('Bio must be less than 80 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('avatar')
    .optional()
    .custom((value) => {
      if (!value) return true;
      // Allow URLs, base64 data URLs, or relative paths
      if (typeof value === 'string' && (
        value.startsWith('http') || 
        value.startsWith('data:image/') || 
        value.startsWith('/uploads/')
      )) {
        return true;
      }
      throw new Error('Avatar must be a valid URL or base64 image');
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      username, 
      email, 
      fullName, 
      bio, 
      phone, 
      dateOfBirth, 
      location, 
      website, 
      avatar 
    } = req.body;
    const updateData = {};

    if (username) {
      // Check if username is already taken
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      
      updateData.username = username;
    }

    if (email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user._id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken'
        });
      }
      
      updateData.email = email;
    }

    // Update other fields
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/avatar-debug
// @desc    Debug user avatar
// @access  Private
router.get('/avatar-debug', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('avatar');
    res.json({
      success: true,
      avatar: user.avatar,
      avatarUrl: user.avatar ? `http://localhost:5000${user.avatar}` : null
    });
  } catch (error) {
    console.error('Avatar debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Serve avatar image through API to avoid CORS issues
router.get('/avatar/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const avatarPath = path.join(__dirname, '../uploads/avatars', filename);
    
    // Check if file exists
    if (!fs.existsSync(avatarPath)) {
      return res.status(404).json({ success: false, message: 'Avatar not found' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Send the file
    res.sendFile(avatarPath);
  } catch (error) {
    console.error('Avatar serve error:', error);
    res.status(500).json({ success: false, message: 'Error serving avatar' });
  }
});

module.exports = router;
