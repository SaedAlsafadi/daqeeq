const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Supabase client with anon key (respects RLS)
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://pkfsgpqmicgbtfompvnn.supabase.co',
  process.env.SUPABASE_ANON_KEY || ''
);

// Initialize Supabase service client (bypasses RLS)
const supabaseService = createClient(
  process.env.SUPABASE_URL || 'https://pkfsgpqmicgbtfompvnn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function to get a client for transactions
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = {
  query,
  getClient,
  pool,
  supabase,
  supabaseService
};