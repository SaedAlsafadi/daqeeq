const express = require('express');
const router = express.Router();
const axios = require('axios');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001';

// Get ML API health status
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/health`);
    res.json({
      success: true,
      ml_service: response.data
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'ML service unavailable',
      message: error.message
    });
  }
});

// Get models information
router.get('/models/info', async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/models/info`);
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models info',
      message: error.message
    });
  }
});

// Make prediction
router.post('/predict', async (req, res) => {
  try {
    const {
      facility_size_sqm,
      number_of_people,
      number_of_bathrooms,
      days_count,
      cleaning_frequency,
      organization_type
    } = req.body;

    // Validate required fields
    if (!facility_size_sqm || !number_of_people || !number_of_bathrooms || !organization_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['facility_size_sqm', 'number_of_people', 'number_of_bathrooms', 'organization_type']
      });
    }

    // Call ML API
    const response = await axios.post(`${ML_API_URL}/predict`, {
      facility_size_sqm: parseFloat(facility_size_sqm),
      number_of_people: parseInt(number_of_people),
      number_of_bathrooms: parseInt(number_of_bathrooms),
      days_count: days_count ? parseInt(days_count) : 30,
      cleaning_frequency: cleaning_frequency || 'Daily',
      organization_type: organization_type
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Prediction error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Prediction failed',
      message: error.response?.data?.message || error.message
    });
  }
});

// Predict single target
router.post('/predict/:target', async (req, res) => {
  try {
    const { target } = req.params;
    const inputData = req.body;

    const response = await axios.post(`${ML_API_URL}/predict/${target}`, inputData);

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Prediction error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Prediction failed',
      message: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;