const express = require('express');
const { supabase } = require('../../config/database');
const { authenticateToken } = require('../utils/auth');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const router = express.Router();

/**
 * @route   POST /api/suppliers/submit-contact
 * @desc    Submit supplier/service provider contact form
 * @access  Public
 */
router.post('/submit-contact', [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('message').trim().optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      fullName, email, phone, companyName, category, message,
      servicesOffered, certifications, address, city, country, website
    } = req.body;

    // Check for existing submissions - FIXED: removed .single()
    const { data: existingSubmissions } = await supabase
      .from('supplier_contact_submissions')
      .select('id, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingSubmissions && existingSubmissions.length > 0) {
      const hoursSince = (Date.now() - new Date(existingSubmissions[0].created_at).getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return res.status(409).json({
          success: false,
          message: `Please wait ${Math.round(24 - hoursSince)} more hours before submitting again`
        });
      }
    }

    // Save submission
    // Validate and format IP address (INET type in database)
    let ipAddress = null;
    if (req.ip) {
      // Handle IPv6 localhost format (::1 or ::ffff:127.0.0.1)
      let ip = req.ip;
      if (ip.includes('::ffff:')) {
        ip = ip.replace('::ffff:', '');
      }
      // Only use valid IP addresses
      if (/^[\d.]+$/.test(ip) || /^[0-9a-fA-F:]+$/.test(ip)) {
        ipAddress = ip;
      }
    }

    const { data: submission, error } = await supabase
      .from('supplier_contact_submissions')
      .insert({
        full_name: fullName,
        email,
        phone,
        company_name: companyName,
        category,
        message,
        submission_data: { servicesOffered, certifications, address, city, country, website },
        status: 'new',
        ip_address: ipAddress,
        user_agent: req.get('user-agent')
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Submitted data:', { fullName, email, phone, companyName, category, ipAddress });
      return res.status(500).json({
        success: false,
        message: 'Failed to submit form',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Contact information received',
      submissionId: submission.id
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/check-submission/:submissionId', async (req, res) => {
  try {
    const { data: submission, error } = await supabase
      .from('supplier_contact_submissions')
      .select('id, status, created_at, updated_at, company_name')
      .eq('id', req.params.submissionId)
      .single();

    if (error || !submission) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const { data: user } = await supabase.from('users').select('role').eq('id', req.user.userId).single();

    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let query = supabase.from('supplier_contact_submissions').select('*', { count: 'exact' });
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const offset = (page - 1) * limit;
    const { data: submissions, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch' });
    }

    res.json({
      success: true,
      submissions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/submissions/:submissionId', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('role').eq('id', req.user.userId).single();
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { data: submission, error } = await supabase
      .from('supplier_contact_submissions')
      .select('*')
      .eq('id', req.params.submissionId)
      .single();

    if (error || !submission) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch('/submissions/:submissionId/status', authenticateToken, [
  body('status').isIn(['reviewing', 'contacted', 'approved', 'rejected', 'closed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { data: user } = await supabase.from('users').select('role').eq('id', req.user.userId).single();
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { status, reason } = req.body;
    const { data: updated, error } = await supabase
      .from('supplier_contact_submissions')
      .update({ status, assigned_to: req.user.userId, updated_at: new Date().toISOString() })
      .eq('id', req.params.submissionId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to update' });
    }

    await supabase.from('supplier_communication_log').insert({
      submission_id: req.params.submissionId,
      communication_type: 'note',
      subject: `Status changed to: ${status}`,
      message: reason || '',
      conducted_by: req.user.userId,
      status: 'completed'
    });

    res.json({ success: true, message: 'Updated', submission: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/create-service-provider', authenticateToken, [
  body('submissionId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { data: user } = await supabase.from('users').select('role').eq('id', req.user.userId).single();
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { submissionId, servicesOffered } = req.body;
    const { data: submission, error: submissionError } = await supabase
      .from('supplier_contact_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const { data: provider, error: providerError } = await supabase
      .from('service_providers')
      .insert({
        company_name: submission.company_name,
        email: submission.email,
        phone: submission.phone,
        category: submission.category,
        description: submission.message,
        services_offered: servicesOffered || submission.submission_data?.servicesOffered,
        certifications: submission.submission_data?.certifications,
        address: submission.submission_data?.address,
        city: submission.submission_data?.city,
        country: submission.submission_data?.country,
        website: submission.submission_data?.website,
        status: 'approved',
        approved_by: req.user.userId,
        approval_date: new Date().toISOString(),
        account_username: submission.email,
        account_password_temp: hashedPassword,
        account_created_date: new Date().toISOString()
      })
      .select()
      .single();

    if (providerError) {
      console.error('Provider error:', providerError);
      return res.status(500).json({ success: false, message: 'Failed to create provider' });
    }

    const nameParts = submission.full_name.split(' ');
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: submission.email,
        password_hash: hashedPassword,
        first_name: nameParts[0] || 'Service',
        last_name: nameParts.slice(1).join(' ') || 'Provider',
        role: 'service_provider',
        company_name: submission.company_name,
        job_title: 'Service Provider',
        phone: submission.phone,
        force_password_change: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('User error:', userError);
      await supabase.from('service_providers').delete().eq('id', provider.id);
      return res.status(500).json({ success: false, message: 'Failed to create user', error: userError.message });
    }

    await supabase.from('supplier_contact_submissions')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', submissionId);

    const steps = ['verification', 'contract_signed', 'credentials_sent', 'account_activated', 'training_completed'];
    for (const step of steps) {
      await supabase.from('supplier_onboarding_steps').insert({
        service_provider_id: provider.id,
        step_name: step,
        status: step === 'verification' ? 'completed' : 'pending'
      });
    }

    await supabase.from('supplier_communication_log').insert({
      service_provider_id: provider.id,
      submission_id: submissionId,
      communication_type: 'email',
      subject: 'Account Created',
      message: `Temp password: ${tempPassword}`,
      conducted_by: req.user.userId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Provider created',
      provider: {
        id: provider.id,
        companyName: provider.company_name,
        email: provider.email,
        username: provider.account_username,
        status: provider.status,
        tempPassword
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/service-providers', authenticateToken, async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 20 } = req.query;
    const { data: user } = await supabase.from('users').select('role').eq('id', req.user.userId).single();

    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let query = supabase.from('service_providers')
      .select('id, company_name, email, category, status, average_rating, total_reviews, created_at', { count: 'exact' });
    if (status) query = query.eq('status', status);

    const offset = (page - 1) * limit;
    const { data: providers, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch' });
    }

    res.json({
      success: true,
      providers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('role').eq('id', req.user.userId).single();
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { data: submissions } = await supabase.from('supplier_contact_submissions').select('status');
    const { data: providers } = await supabase.from('service_providers').select('status');

    const submissionsByStatus = submissions?.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const providersByStatus = providers?.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      success: true,
      stats: {
        submissions: { total: submissions?.length || 0, byStatus: submissionsByStatus },
        providers: { total: providers?.length || 0, byStatus: providersByStatus }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;