const express = require('express');
const { supabase } = require('../../config/database');
const { authenticateToken } = require('../utils/auth');
const crypto = require('crypto');

const router = express.Router();

/**
 * @route   POST /api/contracts/generate/:requestId
 * @desc    Generate a contract and simulate blockchain hashing
 * @access  Private
 */
router.post('/generate/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.userId;

        // Fetch the quotation request
        const { data: request, error: fetchError } = await supabase
            .from('quotation_requests')
            .select('*, companies(name), service_providers(company_name)')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) {
            return res.status(404).json({
                success: false,
                message: 'Quotation request not found'
            });
        }

        // Verify user has access (either client or provider)
        // For now, we assume the client initiates the contract generation upon acceptance

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
        const contractHash = crypto.createHash('sha256').update(contractContent).digest('hex');

        // In a real blockchain implementation, we would send this hash to a smart contract here.
        // For simulation, we just store the hash in our database.

        // Update the request with contract details
        const { data: updatedRequest, error: updateError } = await supabase
            .from('quotation_requests')
            .update({
                contract_status: 'signed', // Auto-signing for simulation simplicity
                contract_hash: contractHash,
                signed_at: new Date().toISOString(),
                status: 'contracting' // Move to contracting phase
            })
            .eq('id', requestId)
            .select()
            .single();

        if (updateError) {
            console.error('Contract update error:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate contract'
            });
        }

        return res.json({
            success: true,
            message: 'Contract generated and signed successfully (Blockchain Simulated)',
            contract: {
                id: updatedRequest.id,
                status: updatedRequest.contract_status,
                hash: updatedRequest.contract_hash,
                signedAt: updatedRequest.signed_at
            }
        });

    } catch (error) {
        console.error('Error generating contract:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
});

/**
 * @route   GET /api/contracts/:requestId
 * @desc    Get contract details
 * @access  Private
 */
router.get('/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;

        const { data: request, error } = await supabase
            .from('quotation_requests')
            .select('contract_status, contract_hash, signed_at, status')
            .eq('id', requestId)
            .single();

        if (error || !request) {
            return res.status(404).json({
                success: false,
                message: 'Contract not found'
            });
        }

        return res.json({
            success: true,
            contract: {
                status: request.contract_status,
                hash: request.contract_hash,
                signedAt: request.signed_at,
                requestStatus: request.status
            }
        });
    } catch (error) {
        console.error('Error fetching contract:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
});

module.exports = router;
