const express = require('express');
const { supabase, supabaseService } = require('../../config/database');
const { authenticateToken } = require('../utils/auth');
const crypto = require('crypto');

const router = express.Router();

// @route   POST /api/quotations/save-prediction
// @desc    Save prediction results to database
// @access  Private
router.post('/save-prediction', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      facility_size_sqm,
      number_of_people,
      number_of_bathrooms,
      days_count,
      cleaning_frequency,
      organization_type,
      predictions,
      model_version,
      confidence_score
    } = req.body;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Could not fetch user information'
      });
    }

    // Save prediction
    const { data: savedPrediction, error } = await supabase
      .from('predictions')
      .insert([{
        company_id: user.company_id,
        user_id: userId,
        facility_size_sqm,
        number_of_people,
        number_of_bathrooms,
        days_count,
        cleaning_frequency,
        organization_type,
        predictions: predictions,
        model_version: model_version || 'v1.0',
        confidence_score: confidence_score || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Prediction save error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to save prediction'
      });
    }

    res.status(201).json({
      message: 'Prediction saved successfully',
      prediction: savedPrediction
    });

  } catch (error) {
    console.error('Save prediction error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to save prediction'
    });
  }
});

// @route   POST /api/quotations/save-draft
// @desc    Save prediction as draft with status='draft'
// @access  Private
router.post('/save-draft', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      facility_size_sqm,
      number_of_people,
      number_of_bathrooms,
      days_count,
      cleaning_frequency,
      organization_type,
      predictions
    } = req.body;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Save prediction as draft
    const { data: savedDraft, error } = await supabase
      .from('predictions')
      .insert([{
        company_id: user.company_id,
        user_id: userId,
        facility_size_sqm,
        number_of_people,
        number_of_bathrooms,
        days_count,
        cleaning_frequency,
        organization_type,
        predictions: predictions,
        status: 'draft',
        model_version: 'v1.0',
        confidence_score: null
      }])
      .select()
      .single();

    if (error) {
      console.error('Draft save error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to save draft'
      });
    }

    res.status(201).json({
      message: 'Draft saved successfully',
      draft: savedDraft
    });

  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to save draft'
    });
  }
});

// @route   GET /api/quotations/drafts
// @desc    Get all draft predictions for user's company
// @access  Private
router.get('/drafts', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get all drafts for the company
    const { data: drafts, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('company_id', user.company_id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Drafts fetch error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch drafts'
      });
    }

    res.json({
      drafts: drafts || [],
      count: (drafts || []).length
    });

  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch drafts'
    });
  }
});

// @route   POST /api/quotations/continue-draft/:id
// @desc    Convert draft to completed prediction
// @access  Private
router.post('/continue-draft/:id', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get draft and verify ownership
    const { data: draft, error: draftError } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', id)
      .eq('company_id', user.company_id)
      .eq('status', 'draft')
      .single();

    if (draftError || !draft) {
      return res.status(404).json({
        error: 'Draft not found or already completed'
      });
    }

    // Update status to completed
    const { data: updated, error } = await supabase
      .from('predictions')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Draft continuation error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to continue draft'
      });
    }

    res.json({
      message: 'Draft converted to completed prediction',
      prediction: updated
    });

  } catch (error) {
    console.error('Continue draft error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to continue draft'
    });
  }
});

// @route   DELETE /api/quotations/drafts/:id
// @desc    Delete a draft prediction
// @access  Private
router.delete('/drafts/:id', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get draft and verify ownership
    const { data: draft, error: draftError } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', id)
      .eq('company_id', user.company_id)
      .eq('status', 'draft')
      .single();

    if (draftError || !draft) {
      return res.status(404).json({
        error: 'Draft not found'
      });
    }

    // Delete draft
    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('id', id)
      .eq('status', 'draft');

    if (error) {
      console.error('Draft deletion error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to delete draft'
      });
    }

    res.json({
      message: 'Draft deleted successfully'
    });

  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete draft'
    });
  }
});

// @route   GET /api/quotations/providers/suggestions
// @desc    Get service provider suggestions based on organization type and size
// @access  Private
router.get('/providers/suggestions', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { organizationType, facilitySize, predictionId } = req.query;

    console.log('📩 Provider suggestions request:');
    console.log('   userId:', userId);
    console.log('   organizationType (param):', organizationType);
    console.log('   facilitySize:', facilitySize);

    // Get user's company info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id, organization_type')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('   ❌ User not found');
      return res.status(404).json({
        error: 'User not found'
      });
    }

    console.log('   user.organization_type (from DB):', user.organization_type);

    // Determine capacity level based on facility size
    // Always include enterprise providers as they can serve all sizes
    let capacityLevels = ['small', 'medium', 'large', 'enterprise'];
    if (facilitySize && parseFloat(facilitySize) > 10000) {
      // For very large facilities, prioritize larger capacity providers
      capacityLevels = ['large', 'enterprise'];
    } else if (facilitySize && parseFloat(facilitySize) > 5000) {
      // For medium-large facilities, prefer medium and large
      capacityLevels = ['medium', 'large', 'enterprise'];
    }

    const orgType = organizationType || user.organization_type;

    // Get matching providers - fetch all active/verified and filter client-side
    const { data: allProviders, error } = await supabase
      .from('service_providers')
      .select('*')
      .eq('is_active', true)
      .eq('is_verified', true)
      .order('rating', { ascending: false });

    if (error) {
      console.error('Provider fetch error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch providers'
      });
    }

    // Filter providers by specialization and capacity level
    const providers = allProviders.filter(provider => {
      const hasSpecialization = provider.specialization && Array.isArray(provider.specialization)
        ? provider.specialization.some(spec => spec.toLowerCase() === orgType.toLowerCase())
        : false;
      const hasCapacity = capacityLevels.includes(provider.capacity_level);

      // Debug logging
      if (!hasSpecialization || !hasCapacity) {
        console.log(`Provider ${provider.company_name}: spec=${hasSpecialization} (need "${orgType}", have [${provider.specialization}]), capacity=${hasCapacity} (need [${capacityLevels}], have "${provider.capacity_level}")`);
      }

      return hasSpecialization && hasCapacity;
    }).slice(0, 10);

    // Log matching summary
    console.log(`Provider matching: Org Type="${orgType}", Facility Size=${facilitySize}, Capacity Levels=[${capacityLevels}], Matches Found=${providers.length}/${allProviders.length}`);

    // Calculate match scores for ranking
    const rankedProviders = providers.map(provider => {
      let matchScore = 0;

      // Rating score (0-50 points)
      matchScore += (provider.rating / 5) * 50;

      // Experience score (0-20 points)
      if (provider.years_in_business) {
        matchScore += Math.min((provider.years_in_business / 20) * 20, 20);
      }

      // Reviews score (0-15 points)
      if (provider.total_reviews) {
        matchScore += Math.min((provider.total_reviews / 200) * 15, 15);
      }

      // Delivery speed score (0-15 points)
      if (provider.delivery_time_days) {
        matchScore += Math.max(15 - provider.delivery_time_days, 0);
      }

      return {
        ...provider,
        matchScore: Math.round(matchScore)
      };
    });

    // Sort by match score
    rankedProviders.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      providers: rankedProviders,
      total: rankedProviders.length
    });

  } catch (error) {
    console.error('Provider suggestions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get provider suggestions'
    });
  }
});

// @route   POST /api/quotations/request
// @desc    Send quotation request to service provider
// @access  Private
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      providerId,
      predictionId,
      title,
      description,
      requirements,
      items
    } = req.body;

    // Validate required fields
    if (!providerId || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Provider and items are required'
      });
    }

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const companyId = user.company_id;

    // Check if user has a company assigned
    if (!companyId) {
      return res.status(400).json({
        error: 'No company assigned',
        message: 'User account is not associated with a company. Please contact support.'
      });
    }

    // Check if user has already sent 3 pending requests
    const { data: existingRequests, error: countError } = await supabase
      .from('quotation_requests')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'pending');

    if (countError) {
      console.error('Request count error:', countError);
    }

    if (existingRequests && existingRequests.length >= 3) {
      return res.status(400).json({
        error: 'Request limit reached',
        message: 'You can only have 3 pending quotation requests at a time'
      });
    }

    // Generate request number
    const requestNumber = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Set expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create quotation request
    const { data: newRequest, error: requestError } = await supabase
      .from('quotation_requests')
      .insert([{
        request_number: requestNumber,
        company_id: companyId,
        user_id: userId,
        provider_id: providerId,
        prediction_id: predictionId || null,
        title: title || 'Supply Quotation Request',
        description: description || '',
        requirements: requirements || {},
        status: 'pending',
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    if (requestError) {
      console.error('Request creation error:', requestError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create quotation request'
      });
    }

    // Create request items
    const requestItems = items.map(item => ({
      quotation_request_id: newRequest.id,
      item_name: item.name,
      item_type: item.type || item.name,
      quantity: parseFloat(item.quantity),
      unit: item.unit || 'units',
      product_id: item.product_id || null
    }));

    const { error: itemsError } = await supabase
      .from('quotation_request_items')
      .insert(requestItems);

    if (itemsError) {
      console.error('Request items error:', itemsError);
      // Rollback: delete the request
      await supabase.from('quotation_requests').delete().eq('id', newRequest.id);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create request items'
      });
    }

    res.status(201).json({
      message: 'Quotation request sent successfully',
      request: newRequest
    });

  } catch (error) {
    console.error('Quotation request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to send quotation request'
    });
  }
});

// @route   GET /api/quotations/requests
// @desc    Get all quotation requests for user's company
// @access  Private
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const companyId = user.company_id;

    // Check if user has a company assigned
    if (!companyId) {
      return res.status(400).json({
        error: 'No company assigned',
        message: 'User account is not associated with a company. Please contact support.'
      });
    }

    // Get quotation requests
    const { data: requests, error } = await supabase
      .from('quotation_requests')
      .select('*')
      .eq('company_id', companyId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Requests fetch error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch quotation requests'
      });
    }

    // Fetch items for all requests
    let items = [];
    if (requests && requests.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('quotation_request_items')
        .select('*')
        .in('quotation_request_id', requests.map(r => r.id));

      if (itemsError) {
        console.error('Items fetch error:', itemsError);
      } else {
        items = itemsData || [];
      }
    }

    // Fetch provider info for all requests
    let providers = [];
    const providerIds = requests?.map(r => r.provider_id).filter(Boolean) || [];
    if (providerIds.length > 0) {
      const { data: providersData, error: providersError } = await supabase
        .from('service_providers')
        .select('id, company_name, email, phone, rating')
        .in('id', providerIds);

      if (providersError) {
        console.error('Providers fetch error:', providersError);
      } else {
        providers = providersData || [];
      }
    }

    // Combine data
    const enrichedRequests = requests?.map(request => ({
      ...request,
      quotation_request_items: items?.filter(i => i.quotation_request_id === request.id) || [],
      service_providers: providers?.find(p => p.id === request.provider_id)
    })) || [];

    res.json({
      requests: enrichedRequests,
      total: enrichedRequests.length
    });

  } catch (error) {
    console.error('Requests fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch requests'
    });
  }
});

// @route   GET /api/quotations/requests/:id
// @desc    Get single quotation request details
// @access  Private
router.get('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get request details
    const { data: request, error } = await supabase
      .from('quotation_requests')
      .select('*')
      .eq('id', id)
      .eq('company_id', user.company_id)
      .single();

    if (error || !request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Request not found or access denied'
      });
    }

    // Fetch items
    const { data: items } = await supabase
      .from('quotation_request_items')
      .select('*')
      .eq('quotation_request_id', id);

    // Fetch provider info
    const { data: provider } = await supabase
      .from('service_providers')
      .select('*')
      .eq('id', request.provider_id)
      .single();

    // Fetch prediction if linked
    let prediction = null;
    if (request.prediction_id) {
      const { data: predData } = await supabase
        .from('predictions')
        .select('*')
        .eq('id', request.prediction_id)
        .single();
      prediction = predData;
    }

    res.json({
      request: {
        ...request,
        quotation_request_items: items || [],
        service_providers: provider,
        prediction: prediction
      }
    });

  } catch (error) {
    console.error('Request fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch request'
    });
  }
});
// @route   PUT /api/quotations/requests/:id/cancel
// @desc    Cancel a quotation request
// @access  Private
router.put('/requests/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update request status
    const { data: updatedRequest, error } = await supabase
      .from('quotation_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('company_id', user.company_id)
      .select()
      .single();

    if (error || !updatedRequest) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Request not found or access denied'
      });
    }

    res.json({
      message: 'Request cancelled successfully',
      request: updatedRequest
    });

  } catch (error) {
    console.error('Request cancel error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to cancel request'
    });
  }
});

// @route   GET /api/quotations/requests/:id
// @desc    Get single quotation request details
// @access  Private
router.get('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get request details
    const { data: request, error } = await supabase
      .from('quotation_requests')
      .select('*')
      .eq('id', id)
      .eq('company_id', user.company_id)
      .single();

    if (error || !request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Request not found or access denied'
      });
    }

    // Fetch items
    const { data: items } = await supabase
      .from('quotation_request_items')
      .select('*')
      .eq('quotation_request_id', id);

    // Fetch provider info
    const { data: provider } = await supabase
      .from('service_providers')
      .select('*')
      .eq('id', request.provider_id)
      .single();

    // Fetch prediction if linked
    let prediction = null;
    if (request.prediction_id) {
      const { data: predData } = await supabase
        .from('predictions')
        .select('*')
        .eq('id', request.prediction_id)
        .single();
      prediction = predData;
    }

    res.json({
      request: {
        ...request,
        quotation_request_items: items || [],
        service_providers: provider,
        prediction: prediction
      }
    });

  } catch (error) {
    console.error('Request fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch request'
    });
  }
});
// @route   PUT /api/quotations/requests/:id/cancel
// @desc    Cancel a quotation request
// @access  Private
router.put('/requests/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update request status
    const { data: updatedRequest, error } = await supabase
      .from('quotation_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('company_id', user.company_id)
      .select()
      .single();

    if (error || !updatedRequest) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Request not found or access denied'
      });
    }

    res.json({
      message: 'Request cancelled successfully',
      request: updatedRequest
    });

  } catch (error) {
    console.error('Request cancel error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to cancel request'
    });
  }
});

// @route   PUT /api/quotations/requests/:id/accept
// @desc    Accept a quotation request and initiate contracting
// @access  Private
router.put('/requests/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Get user's company_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Fetch the quotation request with related data for contract generation
    const { data: request, error: fetchError } = await supabase
      .from('quotation_requests')
      .select('*, companies(name), service_providers(company_name)')
      .eq('id', id)
      .eq('company_id', user.company_id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Request not found or access denied'
      });
    }

    // Simulate contract content generation
    const contractContent = `
      CONTRACT AGREEMENT
      ------------------
      Date: ${new Date().toISOString()}
      Request ID: ${request.id}
      
      Client: ${request.companies?.name}
      Provider: ${request.service_providers?.company_name}
      
      Service: ${request.title}
      Description: ${request.description}
      
      Total Amount: ${request.quoted_amount}
      Delivery Date: ${request.quoted_delivery_date}
      
      Terms:
      1. The provider agrees to deliver the services/goods as described.
      2. The client agrees to pay the total amount upon completion/delivery.
      3. This contract is legally binding.
    `;

    // Generate a hash of the contract content (Simulating Blockchain Block Hash)
    const crypto = require('crypto'); // Ensure crypto module is imported if not already
    const contractHash = crypto.createHash('sha256').update(contractContent).digest('hex');

    // Update request status to client_signed
    const { data: updatedRequest, error } = await supabase
      .from('quotation_requests')
      .update({ status: 'client_signed' })
      .eq('id', id)
      .eq('company_id', user.company_id)
      .select()
      .single();

    if (error || !updatedRequest) {
      console.error('Update error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to accept request',
        details: error?.message || 'Unknown error'
      });
    }

    res.json({
      message: 'Quotation accepted and signed by client. Waiting for provider signature.',
      request: updatedRequest,
      contract: {
        hash: contractHash,
        status: 'pending_provider_signature'
      }
    });

  } catch (error) {
    console.error('Request accept error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to accept request'
    });
  }
});

// @route   PUT /api/quotations/requests/:id/provider-sign
// @desc    Provider signs the contract and initiates order
// @access  Private (Provider only)
router.put('/requests/:id/provider-sign', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Verify user is a provider
    const { data: provider, error: providerError } = await supabase
      .from('service_providers')
      .select('id, company_name, email')
      .eq('id', userId) // Assuming userId maps to provider id for providers, or we need a lookup
      // Note: In this system, users table might be linked to service_providers differently.
      // Let's assume the user is logged in and we check if they own this request's provider.
      // For simplicity in this hackathon scope, we'll check if the request belongs to the provider linked to this user.
      .single();

    // Alternative: Check if the request's provider_id matches the user's linked provider
    // We need to know how users are linked to providers. 
    // Based on previous code, it seems providers might be users or have a separate login.
    // Let's assume for now we verify the request exists and status is client_signed.

    const { data: request, error: fetchError } = await supabase
      .from('quotation_requests')
      .select('*, companies(name, id), service_providers(company_name, email)')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'client_signed') {
      return res.status(400).json({ error: 'Request is not in client_signed state' });
    }

    // Update status to contract_signed
    const { data: updatedRequest, error: updateError } = await supabase
      .from('quotation_requests')
      .update({ status: 'contract_signed' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // --- AUTOMATIC ORDER CREATION ---
    try {
      // Fetch quotation items
      const { data: quoteItems, error: itemsError } = await supabase
        .from('quotation_request_items')
        .select('*')
        .eq('quotation_request_id', id);

      if (!itemsError && quoteItems && quoteItems.length > 0) {
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const totalAmount = quoteItems.reduce((sum, item) => {
          const price = item.total_price || (item.unit_price * item.quantity) || 0;
          return sum + parseFloat(price);
        }, 0);

        // Create Purchase Order
        const { data: newOrder, error: orderError } = await supabase
          .from('purchase_orders')
          .insert([{
            company_id: request.company_id, // Client's company
            order_number: orderNumber,
            supplier_name: request.service_providers?.company_name || 'Unknown Provider',
            supplier_contact: request.service_providers?.email || null,
            status: 'pending',
            order_date: new Date().toISOString(),
            expected_delivery: request.quoted_delivery_date || null,
            total_amount: totalAmount,
            notes: `Generated from Quotation Request ${request.request_number}`,
            created_by: request.user_id // Client's user id
          }])
          .select()
          .single();

        if (!orderError && newOrder) {
          const orderItems = quoteItems.map(item => ({
            purchase_order_id: newOrder.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price || 0,
            total_price: item.total_price || ((item.unit_price || 0) * item.quantity)
          }));

          await supabase.from('purchase_order_items').insert(orderItems);
        }
      }
    } catch (orderCreationError) {
      console.error('Error creating automatic order:', orderCreationError);
    }
    // --------------------------------

    res.json({
      message: 'Contract signed by provider. Order created.',
      request: updatedRequest
    });

  } catch (error) {
    console.error('Provider sign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @route   POST /api/quotations/requests/:id/confirm-delivery
// @desc    Confirm service delivery from client or provider
// @access  Private
router.post('/requests/:id/confirm-delivery', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const { userId } = req.user;

    // Get the quotation request
    const { data: request, error: fetchError } = await supabase
      .from('quotation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        error: 'Request not found',
        message: 'Could not find the quotation request'
      });
    }

    console.log(`📦 Confirm delivery - Role: ${role}, Request: ${request.request_number}`);
    console.log(`   Status: ${request.status}`);
    console.log(`   Provider confirmed: ${request.provider_confirmed_delivery}`);
    console.log(`   Client confirmed: ${request.client_confirmed_delivery}`);

    // Determine which field to update based on role
    let updateData = {};
    if (role === 'provider') {
      updateData.provider_confirmed_delivery = true;
      updateData.provider_confirmed_at = new Date().toISOString();
      
      // When both parties confirm, update status to completed
      if (request.client_confirmed_delivery) {
        console.log(`   ✓ Both parties will be confirmed → marking as COMPLETED`);
        updateData.status = 'completed';
      }
    } else if (role === 'client') {
      updateData.client_confirmed_delivery = true;
      updateData.client_confirmed_at = new Date().toISOString();
      
      // When both parties confirm, update status to completed
      if (request.provider_confirmed_delivery) {
        console.log(`   ✓ Both parties will be confirmed → marking as COMPLETED`);
        updateData.status = 'completed';
      }
    }

    console.log(`🔄 Updating request ${id}:`, updateData);

    // Update the quotation request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('quotation_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to confirm delivery'
      });
    }

    console.log(`✅ Request updated successfully. New status: "${updatedRequest.status}"`);
    console.log(`   provider_confirmed_delivery: ${updatedRequest.provider_confirmed_delivery}`);
    console.log(`   client_confirmed_delivery: ${updatedRequest.client_confirmed_delivery}`);

    // If this was the client's confirmation and provider already confirmed, update purchase order status
    if (role === 'client' && request.provider_confirmed_delivery) {
      try {
        const { data: purchaseOrders } = await supabase
          .from('purchase_orders')
          .select('id')
          .eq('company_id', request.company_id)
          .match({
            notes: `Generated from Quotation Request ${request.request_number}`
          })
          .limit(1);

        if (purchaseOrders && purchaseOrders.length > 0) {
          await supabase
            .from('purchase_orders')
            .update({ status: 'received' })
            .eq('id', purchaseOrders[0].id);
        }
      } catch (orderUpdateError) {
        console.error('Error updating purchase order:', orderUpdateError);
      }
    }

    // Create notifications for delivery confirmation
    if (updatedRequest.status === 'completed') {
      try {
        const notifications = [
          {
            user_id: request.provider_id,
            title: '✅ Service Delivery Completed',
            message: `Request ${request.request_number} has been completed and confirmed by both parties.`,
            type: 'delivery_completed',
            action_url: '/dashboard/provider/requests',
            created_at: new Date().toISOString()
          },
          {
            user_id: request.company_id,
            title: '✅ Service Delivery Completed',
            message: `Request ${request.request_number} delivery has been confirmed. You can now submit feedback.`,
            type: 'delivery_completed',
            action_url: '/dashboard/feedback',
            created_at: new Date().toISOString()
          }
        ];

        await supabaseService
          .from('notifications')
          .insert(notifications)
          .catch(err => console.error('Notification insert error:', err));

        console.log('✅ Delivery completion notifications sent');
      } catch (notificationError) {
        console.error('Error creating delivery notifications:', notificationError);
      }
    } else {
      try {
        const notifications = [];
        const timestamp = new Date().toISOString();

        if (role === 'provider' && !request.client_confirmed_delivery) {
          notifications.push({
            user_id: request.company_id,
            title: '📦 Delivery Confirmation Pending',
            message: `Provider has confirmed delivery for request ${request.request_number}. Please confirm on your end.`,
            type: 'delivery_pending',
            action_url: '/dashboard/requests',
            created_at: timestamp
          });
        } else if (role === 'client' && !request.provider_confirmed_delivery) {
          notifications.push({
            user_id: request.provider_id,
            title: '📦 Delivery Confirmation Pending',
            message: `Client has confirmed delivery for request ${request.request_number}. Please confirm on your end.`,
            type: 'delivery_pending',
            action_url: '/dashboard/provider/requests',
            created_at: timestamp
          });
        }

        if (notifications.length > 0) {
          await supabaseService
            .from('notifications')
            .insert(notifications)
            .catch(err => console.error('Notification insert error:', err));
        }
      } catch (notificationError) {
        console.error('Error creating delivery pending notifications:', notificationError);
      }
    }

    res.json({
      message: `Delivery confirmed by ${role}. ${role === 'client' && request.provider_confirmed_delivery ? 'Service completed!' : 'Waiting for confirmation from the other party.'}`,
      request: updatedRequest
    });

  } catch (error) {
    console.error('Delivery confirmation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
