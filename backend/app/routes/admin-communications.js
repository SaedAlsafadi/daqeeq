const express = require('express');
const { supabase, supabaseService } = require('../../config/database');
const { authenticateToken, requireAdmin } = require('../utils/auth');

const router = express.Router();

router.use(authenticateToken);

const getUserCompanyId = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data.company_id;
};

router.post('/send-to-providers', requireAdmin, async (req, res) => {
  try {
    const { message, provider_ids, subject } = req.body;
    const { user } = req;

    if (!message || !subject) {
      return res.status(400).json({
        error: 'Missing required fields: message and subject'
      });
    }

    const notifications = [];

    if (provider_ids && provider_ids.length > 0) {
      for (const providerId of provider_ids) {
        const notification = {
          user_id: providerId,
          title: `Admin Message: ${subject}`,
          message: message,
          type: 'admin_message',
          action_url: '/dashboard/notifications',
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabaseService
          .from('notifications')
          .insert([notification])
          .select();

        if (!error && data) {
          notifications.push(data[0]);
        }
      }
    } else {
      const { data: providers, error: fetchError } = await supabase
        .from('service_providers')
        .select('id');

      if (!fetchError && providers) {
        for (const provider of providers) {
          const notification = {
            user_id: provider.id,
            title: `Admin Message: ${subject}`,
            message: message,
            type: 'admin_message',
            action_url: '/dashboard/notifications',
            created_at: new Date().toISOString()
          };

          const { data, error } = await supabaseService
            .from('notifications')
            .insert([notification])
            .select();

          if (!error && data) {
            notifications.push(data[0]);
          }
        }
      }
    }

    console.log(`✅ Admin message sent to ${notifications.length} providers`);

    res.json({
      success: true,
      message: `Message sent to ${notifications.length} providers`,
      notifications_count: notifications.length
    });
  } catch (error) {
    console.error('Error sending admin message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.post('/contact-provider', requireAdmin, async (req, res) => {
  try {
    const { message, subject, provider_ids, message_type } = req.body;
    const { user } = req;

    if (!message || !subject) {
      return res.status(400).json({
        error: 'Missing required fields: message and subject'
      });
    }

    const timestamp = new Date().toISOString();
    const notificationTitle = `${message_type === 'supply_request' ? '📦 Supply Request' : '⚠️ Service Issue'}: ${subject}`;

    const notifications = [];

    const targetProviders = provider_ids && provider_ids.length > 0 
      ? provider_ids 
      : [];

    if (targetProviders.length > 0) {
      for (const providerId of targetProviders) {
        const { data, error } = await supabaseService
          .from('notifications')
          .insert([{
            user_id: providerId,
            title: notificationTitle,
            message: message,
            type: 'admin_' + message_type,
            action_url: '/dashboard/provider/communications',
            created_at: timestamp
          }])
          .select();

        if (!error && data) {
          notifications.push(data[0]);
        }
      }
    } else {
      const { data: allProviders } = await supabase
        .from('service_providers')
        .select('id')
        .limit(100);

      if (allProviders && allProviders.length > 0) {
        for (const provider of allProviders) {
          const { data, error } = await supabaseService
            .from('notifications')
            .insert([{
              user_id: provider.id,
              title: notificationTitle,
              message: message,
              type: 'admin_' + message_type,
              action_url: '/dashboard/provider/communications',
              created_at: timestamp
            }])
            .select();

          if (!error && data) {
            notifications.push(data[0]);
          }
        }
      }
    }

    console.log(`✅ Contact message sent to ${notifications.length} providers (Type: ${message_type})`);

    res.json({
      success: true,
      message: `Message sent to ${notifications.length} providers`,
      recipients_count: notifications.length,
      timestamp: timestamp
    });
  } catch (error) {
    console.error('Error in contact-provider:', error);
    res.status(500).json({ error: 'Failed to send contact message' });
  }
});

router.get('/messages', requireAdmin, async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('notifications')
      .select('*')
      .in('type', ['admin_message', 'admin_supply_request', 'admin_service_issue'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    res.json({
      messages: messages || [],
      total: messages ? messages.length : 0
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
