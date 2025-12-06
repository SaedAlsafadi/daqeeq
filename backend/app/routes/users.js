const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../../config/database');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// @route   GET /api/users/profile
// @desc    Get user profile information
// @access  Private
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, company_id, company_name, job_title, organization_type, phone, created_at')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also get company info
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, industry, size, address, phone, email, website')
      .eq('id', user.company_id)
      .single();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        jobTitle: user.job_title,
        organizationType: user.organization_type,
        phone: user.phone,
        companyId: user.company_id,
        createdAt: user.created_at
      },
      company: company || {}
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile information
// @access  Private
router.put('/profile', verifyToken, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('jobTitle').optional().trim().isLength({ min: 1 }),
  body('phone').optional().trim(),
  body('organizationType').optional().isIn([
    'Hotels', 'Hospitals', 'Schools', 'Restaurants', 'Retail Stores',
    'Shopping Malls', 'Airports', 'Banks', 'Gyms', 'Libraries',
    'Storage Facilities', 'Warehouses', 'college', 'company'
  ])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { firstName, lastName, jobTitle, phone, organizationType } = req.body;

    // Prepare update object
    const updateData = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (jobTitle) updateData.job_title = jobTitle;
    if (phone) updateData.phone = phone;
    if (organizationType) updateData.organization_type = organizationType;
    
    updateData.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        companyName: updatedUser.company_name,
        jobTitle: updatedUser.job_title,
        organizationType: updatedUser.organization_type,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// @route   PUT /api/users/facility-type
// @desc    Update facility/organization type
// @access  Private
router.put('/facility-type', verifyToken, [
  body('organizationType').isIn([
    'Hotels', 'Hospitals', 'Schools', 'Restaurants', 'Retail Stores',
    'Shopping Malls', 'Airports', 'Banks', 'Gyms', 'Libraries',
    'Storage Facilities', 'Warehouses', 'college', 'company'
  ]).withMessage('Invalid organization type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { organizationType } = req.body;

    const { data: user, error: userError } = await supabase
      .from('users')
      .update({ 
        organization_type: organizationType,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.userId)
      .select()
      .single();

    if (userError) {
      return res.status(500).json({ error: 'Failed to update facility type' });
    }

    // Also update company industry
    if (user.company_id) {
      await supabase
        .from('companies')
        .update({ industry: organizationType })
        .eq('id', user.company_id);
    }

    res.json({
      message: 'Facility type updated successfully',
      organizationType: user.organization_type
    });
  } catch (error) {
    console.error('Facility type update error:', error);
    res.status(500).json({ error: 'Failed to update facility type' });
  }
});

// @route   POST /api/users/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', verifyToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords do not match')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.userId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;