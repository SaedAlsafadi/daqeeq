const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { supabase } = require('../../config/database');
const { exec } = require('child_process');
const path = require('path');

// Helper function to get company_id for a user
const getUserCompanyId = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    throw new Error('Unable to fetch user company information');
  }
  
  return data.company_id;
};

// Helper function to export feedback data in model-training format
const exportFeedbackForTraining = async (company_id, start_date = null) => {
  try {
    let query = supabase
      .from('supply_feedback')
      .select('*')
      .eq('company_id', company_id)
      .order('submitted_at', { ascending: true });

    if (start_date) {
      query = query.gte('submitted_at', start_date);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform feedback into model training format
    const trainingData = (data || []).map(feedback => ({
      timestamp: feedback.submitted_at,
      supply_type: feedback.supply_type,
      predicted_qty: feedback.predicted_quantity,
      actual_qty: feedback.actual_quantity,
      variance_pct: ((feedback.actual_quantity - feedback.predicted_quantity) / feedback.predicted_quantity) * 100,
      feedback_type: feedback.feedback_type,
      days_until_reorder: feedback.days_until_reorder,
      notes: feedback.notes,
      is_accurate: feedback.feedback_type === 'accurate' ? 1 : 0
    }));

    return trainingData;
  } catch (error) {
    console.error('Error exporting feedback for training:', error);
    throw error;
  }
};

// GET /api/model-training/feedback-export
// Export feedback data for model training
router.get('/feedback-export', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const company_id = await getUserCompanyId(user.userId);

    if (!company_id) {
      return res.status(400).json({ error: 'No company assigned to user' });
    }

    const trainingData = await exportFeedbackForTraining(company_id);

    res.json({
      success: true,
      count: trainingData.length,
      data: trainingData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in feedback-export:', error);
    res.status(500).json({ error: 'Failed to export feedback data' });
  }
});

// POST /api/model-training/trigger-retraining
// Trigger model retraining with recent feedback
router.post('/trigger-retraining', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const company_id = await getUserCompanyId(user.userId);

    if (!company_id) {
      return res.status(400).json({ error: 'No company assigned to user' });
    }

    // Check if there's enough feedback to retrain
    const { data: feedbackCount, error: countError } = await supabase
      .from('supply_feedback')
      .select('id', { count: 'exact' })
      .eq('company_id', company_id);

    if (countError) {
      throw countError;
    }

    const count = feedbackCount?.length || 0;
    const MIN_FEEDBACK_FOR_TRAINING = 20; // Minimum feedback entries needed

    if (count < MIN_FEEDBACK_FOR_TRAINING) {
      return res.json({
        success: false,
        message: `Not enough feedback data. Need ${MIN_FEEDBACK_FOR_TRAINING} entries, have ${count}`,
        current_count: count,
        required_count: MIN_FEEDBACK_FOR_TRAINING
      });
    }

    // Export feedback data
    const trainingData = await exportFeedbackForTraining(company_id);

    // Create training job record
    const { data: job, error: jobError } = await supabase
      .from('model_training_jobs')
      .insert([
        {
          company_id: company_id,
          initiated_by: user.userId,
          status: 'pending',
          feedback_count: count,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    // Trigger Python training script asynchronously (non-blocking)
    const trainingScript = path.join(__dirname, '../../ai-model/train_with_feedback.py');
    const dataFile = path.join(__dirname, `../../ai-model/training_data_${job.id}.json`);

    // Write training data to temp file
    require('fs').writeFileSync(dataFile, JSON.stringify(trainingData, null, 2));

    // Trigger training in background
    exec(
      `python "${trainingScript}" --data-file "${dataFile}" --job-id "${job.id}" --company-id "${company_id}"`,
      { cwd: path.join(__dirname, '../../ai-model') },
      (error, stdout, stderr) => {
        if (error) {
          console.error('Training script error:', error);
          // Update job status to failed
          supabase
            .from('model_training_jobs')
            .update({ status: 'failed', error: error.message })
            .eq('id', job.id)
            .then(() => console.log('Job marked as failed'))
            .catch(err => console.error('Failed to update job status:', err));
        } else {
          console.log('Training started successfully');
          // Job status will be updated by training script
        }
      }
    );

    res.json({
      success: true,
      message: 'Model retraining initiated',
      job_id: job.id,
      feedback_count: count,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error in trigger-retraining:', error);
    res.status(500).json({ error: 'Failed to initiate model retraining' });
  }
});

// GET /api/model-training/jobs
// Get training job history
router.get('/jobs', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const company_id = await getUserCompanyId(user.userId);
    const limit = parseInt(req.query.limit) || 10;

    if (!company_id) {
      return res.status(400).json({ error: 'No company assigned to user' });
    }

    const { data, error } = await supabase
      .from('model_training_jobs')
      .select('*')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      jobs: data || []
    });
  } catch (error) {
    console.error('Error in jobs:', error);
    res.status(500).json({ error: 'Failed to fetch training jobs' });
  }
});

// GET /api/model-training/jobs/:job_id
// Get specific training job details
router.get('/jobs/:job_id', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { job_id } = req.params;
    const company_id = await getUserCompanyId(user.userId);

    if (!company_id) {
      return res.status(400).json({ error: 'No company assigned to user' });
    }

    const { data, error } = await supabase
      .from('model_training_jobs')
      .select('*')
      .eq('id', job_id)
      .eq('company_id', company_id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      success: true,
      job: data
    });
  } catch (error) {
    console.error('Error in job details:', error);
    res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

// POST /api/model-training/auto-retrain-check
// Check if retraining should be triggered automatically
// Called by scheduled tasks or feedback submission
router.post('/auto-retrain-check', async (req, res) => {
  try {
    const { company_id } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Get feedback count since last successful training
    const { data: lastJob } = await supabase
      .from('model_training_jobs')
      .select('created_at')
      .eq('company_id', company_id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const startDate = lastJob ? lastJob.created_at : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentFeedback, error: feedbackError } = await supabase
      .from('supply_feedback')
      .select('id', { count: 'exact' })
      .eq('company_id', company_id)
      .gte('submitted_at', startDate);

    if (feedbackError) {
      throw feedbackError;
    }

    const feedbackCount = recentFeedback?.length || 0;
    const THRESHOLD = 30; // Retrain after 30 new feedback entries

    if (feedbackCount >= THRESHOLD) {
      // Trigger retraining
      const trainingData = await exportFeedbackForTraining(company_id, startDate);

      const { data: job } = await supabase
        .from('model_training_jobs')
        .insert([
          {
            company_id: company_id,
            status: 'pending',
            feedback_count: feedbackCount,
            auto_triggered: true,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      res.json({
        success: true,
        auto_triggered: true,
        job_id: job?.id,
        feedback_count: feedbackCount,
        message: 'Auto-retraining triggered'
      });
    } else {
      res.json({
        success: true,
        auto_triggered: false,
        feedback_count: feedbackCount,
        threshold: THRESHOLD,
        message: `Need ${THRESHOLD - feedbackCount} more feedback entries before auto-retraining`
      });
    }
  } catch (error) {
    console.error('Error in auto-retrain-check:', error);
    res.status(500).json({ error: 'Failed to check auto-retrain condition' });
  }
});

module.exports = router;