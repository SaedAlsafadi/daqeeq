const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../../config/database');
const { authenticateToken, requireAdmin } = require('../utils/auth');

const router = express.Router();

// @route   POST /api/auth/init-admin
// @desc    Initialize first admin account when database is empty
// @access  Public (only works when no users exist)
router.post('/init-admin', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate inputs
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, firstName, and lastName are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if any users exist in the database
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (checkError) {
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: checkError.message
      });
    }

    // Only allow if NO users exist
    if (existingUsers && existingUsers.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Cannot initialize admin account - users already exist. Please use the signup endpoint.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
          company_name: 'Admin',
          job_title: 'Administrator',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('Admin creation error:', userError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create admin account',
        error: userError.message
      });
    }

    // Generate JWT token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    console.log('✅ Admin account created:', email);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Admin init error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize admin account',
      error: error.message
    });
  }
});

// Validation middleware
const validateSignup = [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false, gmail_convert_googlemaildotcom: false }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('role').isIn(['client', 'supplier', 'admin', 'service_provider']).withMessage('Role must be client, supplier, admin, or service_provider'),
  body('companyName').trim().isLength({ min: 1 }).withMessage('Company name is required'),
  body('jobTitle').trim().isLength({ min: 1 }).withMessage('Job title is required'),
  body('organizationType')
    .if(body('role').equals('client'))
    .notEmpty()
    .withMessage('Organization type is required for client accounts')
    .isIn([
      'Hotels', 'Hospitals', 'Schools', 'Restaurants', 'Retail Stores',
      'Shopping Malls', 'Airports', 'Banks', 'Gyms', 'Libraries',
      'Storage Facilities', 'Warehouses', 'college', 'company'
    ])
    .withMessage('Invalid organization type')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false, gmail_convert_googlemaildotcom: false }),
  body('password').notEmpty().withMessage('Password is required')
];

// Generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName, role, companyName, jobTitle, organizationType } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // STEP 1: Create a company for the new user
    console.log('📝 Creating company for:', companyName);
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert([
        {
          name: companyName,
          industry: organizationType || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (companyError) {
      console.error('Company creation error:', companyError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create company'
      });
    }

    console.log('✅ Company created with ID:', newCompany.id);

    // STEP 2: Create user linked to the company
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          company_id: newCompany.id, // Link user to company
          email,
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role,
          company_name: companyName,
          job_title: jobTitle,
          organization_type: organizationType || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Delete the company if user creation fails
      await supabase
        .from('companies')
        .delete()
        .eq('id', newCompany.id);
      
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create user account'
      });
    }

    console.log('✅ User created with ID:', newUser.id, 'Company ID:', newUser.company_id);

    // STEP 3: If role is service_provider, create service provider profile
    if (role === 'service_provider') {
      const defaultSpecializations = [
        'Hotels', 'Hospitals', 'Schools', 'Restaurants', 'Retail Stores',
        'Shopping Malls', 'Airports', 'Banks', 'Gyms', 'Libraries',
        'Storage Facilities', 'Warehouses', 'company'
      ];

      const { error: providerError } = await supabase
        .from('service_providers')
        .insert([
          {
            email,
            company_name: companyName,
            contact_person: `${firstName} ${lastName}`,
            phone: null,
            is_active: true,
            is_verified: true,
            specialization: defaultSpecializations,
            capacity_level: 'medium',
            rating: 0,
            total_reviews: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);

      if (providerError) {
        console.error('Provider profile creation error:', providerError);
        // Continue anyway - user is created, provider profile creation is not critical
      } else {
        console.log('✅ Service provider profile created');
      }
    }

    // Generate JWT token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        companyId: newUser.company_id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        companyName: newUser.company_name,
        jobTitle: newUser.job_title,
        organizationType: newUser.organization_type
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create account'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user in database
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (error) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const user = users?.[0];
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        companyId: user.company_id,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyName: user.company_name || null,
        jobTitle: user.job_title || null,
        organizationType: user.organization_type,
        forcePasswordChange: user.force_password_change || false
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to login'
    });
  }
});

// @route   POST /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authorization token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, company_id, first_name, last_name, role, organization_type, company_name, job_title')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        companyId: user.company_id,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyName: user.company_name || null,
        jobTitle: user.job_title || null,
        organizationType: user.organization_type,
        forcePasswordChange: user.force_password_change || false
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
});

// Utility function to generate random temporary password
const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// @route   POST /api/auth/create-provider-account
// @desc    Admin endpoint to create a service provider account with credentials
// @access  Private (requires admin token)
router.post('/create-provider-account', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      email, 
      firstName, 
      lastName, 
      companyName,
      phone,
      tempPassword 
    } = req.body;

    // Validation
    if (!email || !firstName || !lastName || !companyName) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email, firstName, lastName, and companyName are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Check if user already exists
    const { data: existingUser, error: checkUserError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: `An account with email ${email} already exists`
      });
    }

    // Check if service provider already exists
    const { data: existingProvider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProvider) {
      return res.status(400).json({
        error: 'Service provider already exists',
        message: `A service provider profile with email ${email} already exists`
      });
    }

    // Generate temporary password if not provided
    const finalTempPassword = tempPassword || generateTempPassword();

    // Hash the temporary password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(finalTempPassword, saltRounds);

    console.log(`📝 Creating provider account for: ${email}`);

    // STEP 1: Create user record
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role: 'service_provider',
          company_name: companyName,
          job_title: 'Service Provider',
          phone: phone || null,
          is_active: true,
          force_password_change: true, // Flag to force password change on first login
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('❌ User creation error:', userError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create user account',
        details: userError.message
      });
    }

    console.log(`✅ User created with ID: ${newUser.id}`);

    // STEP 2: Create service provider profile
    const defaultSpecializations = [
      'Hotels', 'Hospitals', 'Schools', 'Restaurants', 'Retail Stores',
      'Shopping Malls', 'Airports', 'Banks', 'Gyms', 'Libraries',
      'Storage Facilities', 'Warehouses', 'college', 'company'
    ];

    const { data: newProvider, error: providerError } = await supabase
      .from('service_providers')
      .insert([
        {
          email,
          company_name: companyName,
          contact_person: `${firstName} ${lastName}`,
          phone: phone || null,
          is_active: true,
          is_verified: true,
          specialization: defaultSpecializations,
          capacity_level: 'medium',
          rating: 0,
          total_reviews: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (providerError) {
      console.error('❌ Provider creation error:', providerError);
      
      // Rollback: Delete the user record if provider creation fails
      await supabase
        .from('users')
        .delete()
        .eq('id', newUser.id);

      console.log('↩️  Rolled back user record');

      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create service provider profile',
        details: providerError.message
      });
    }

    console.log(`✅ Service provider profile created with ID: ${newProvider.id}`);

    // Generate JWT token for immediate login
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    console.log(`✅ Account created successfully for: ${email}`);

    // Return credentials and profile data
    res.status(201).json({
      success: true,
      message: 'Service provider account created successfully',
      credentials: {
        email,
        tempPassword: finalTempPassword,
        note: 'Provider must change password on first login'
      },
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        companyName: newUser.company_name,
        phone: newUser.phone,
        forcePasswordChange: true
      },
      provider: {
        id: newProvider.id,
        companyName: newProvider.company_name,
        contactPerson: newProvider.contact_person,
        phone: newProvider.phone,
        isActive: newProvider.is_active,
        isVerified: newProvider.is_verified
      },
      token, // For immediate testing, remove in production if desired
      _instructions: {
        step1: 'Share email and tempPassword with provider',
        step2: 'Provider logs in with email + tempPassword',
        step3: 'Provider is required to set new password on first login',
        step4: 'Provider can then access their dashboard'
      }
    });

  } catch (error) {
    console.error('❌ Provider account creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create service provider account'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password (used for first-time password setup)
// @access  Private (requires auth token)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Current password, new password, and confirmation are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'New password must be at least 6 characters'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'Password mismatch',
        message: 'New password and confirmation do not match'
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'New password must be different from current password'
      });
    }

    // Find user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, password_hash, email')
      .eq('id', userId)
      .single();

    if (findError || !user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Unable to retrieve user information'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear force_password_change flag
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        force_password_change: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to update password'
      });
    }

    console.log(`✅ Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
      email: user.email
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to change password'
    });
  }
});

// @route   POST /api/auth/signup-provider
// @desc    Register a new service provider
// @access  Public
router.post('/signup-provider', [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false, gmail_convert_googlemaildotcom: false }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('companyName').trim().isLength({ min: 1 }).withMessage('Company name is required'),
  body('capacityLevel').optional().isIn(['small', 'medium', 'large', 'enterprise']).withMessage('Invalid capacity level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName, companyName, phone, capacityLevel } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Check if service provider already exists
    const { data: existingProvider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProvider) {
      return res.status(400).json({
        error: 'Service provider already exists',
        message: `A service provider profile with email ${email} already exists`
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log(`📝 Creating provider signup for: ${email}`);

    // STEP 1: Create a company for the provider
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert([
        {
          name: companyName,
          industry: 'Service Provider',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (companyError) {
      console.error('Company creation error:', companyError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create company'
      });
    }

    // STEP 2: Create user record
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          company_id: newCompany.id,
          email,
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role: 'service_provider',
          company_name: companyName,
          job_title: 'Service Provider',
          phone: phone || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Delete company if user creation fails
      await supabase.from('companies').delete().eq('id', newCompany.id);
      
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create user account'
      });
    }

    // STEP 3: Create service provider profile
    const defaultSpecializations = [
      'Hotels', 'Hospitals', 'Schools', 'Restaurants', 'Retail Stores',
      'Shopping Malls', 'Airports', 'Banks', 'Gyms', 'Libraries',
      'Storage Facilities', 'Warehouses', 'college', 'company'
    ];

    const { data: newProvider, error: providerError } = await supabase
      .from('service_providers')
      .insert([
        {
          email,
          company_name: companyName,
          contact_person: `${firstName} ${lastName}`,
          phone: phone || null,
          is_active: true,
          is_verified: true,
          specialization: defaultSpecializations,
          capacity_level: capacityLevel || 'medium',
          rating: 0,
          total_reviews: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (providerError) {
      console.error('Provider creation error:', providerError);
      // Rollback user
      await supabase.from('users').delete().eq('id', newUser.id);
      // Rollback company
      await supabase.from('companies').delete().eq('id', newCompany.id);
      
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create service provider profile'
      });
    }

    // Generate JWT token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    console.log(`✅ Service provider registered: ${email}`);

    res.status(201).json({
      message: 'Service provider account created successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        companyName: newUser.company_name,
        companyId: newUser.company_id
      },
      provider: {
        id: newProvider.id,
        companyName: newProvider.company_name,
        isActive: newProvider.is_active,
        isVerified: newProvider.is_verified,
        specialization: newProvider.specialization,
        capacityLevel: newProvider.capacity_level
      }
    });

  } catch (error) {
    console.error('Provider signup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create service provider account'
    });
  }
});

module.exports = router;