// Flexible database configuration - easily switch between providers
const { createClient } = require('@supabase/supabase-js');

// Database configuration based on environment
const getDatabaseConfig = () => {
  const dbProvider = process.env.DB_PROVIDER || 'supabase';
  
  switch (dbProvider) {
    case 'supabase':
      return {
        type: 'supabase',
        client: createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_ANON_KEY
        ),
        adminClient: createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        )
      };
    
    case 'postgresql':
      // Future: Direct PostgreSQL connection
      const { Pool } = require('pg');
      return {
        type: 'postgresql',
        client: new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        })
      };
    
    case 'mongodb':
      // Future: MongoDB connection
      const { MongoClient } = require('mongodb');
      return {
        type: 'mongodb',
        client: new MongoClient(process.env.MONGODB_URL)
      };
    
    default:
      throw new Error(`Unsupported database provider: ${dbProvider}`);
  }
};

// Database abstraction layer
class DatabaseAdapter {
  constructor() {
    this.config = getDatabaseConfig();
    this.client = this.config.client;
    this.type = this.config.type;
  }

  // Universal query method
  async query(table, operation, data = {}, filters = {}) {
    switch (this.type) {
      case 'supabase':
        return this.supabaseQuery(table, operation, data, filters);
      case 'postgresql':
        return this.postgresQuery(table, operation, data, filters);
      case 'mongodb':
        return this.mongoQuery(table, operation, data, filters);
      default:
        throw new Error(`Unsupported database type: ${this.type}`);
    }
  }

  async supabaseQuery(table, operation, data, filters) {
    let query = this.client.from(table);
    
    switch (operation) {
      case 'select':
        query = query.select(data.select || '*');
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        return await query;
      
      case 'insert':
        return await query.insert(data).select();
      
      case 'update':
        query = query.update(data);
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        return await query.select();
      
      case 'delete':
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        return await query.delete();
      
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  // Future implementations for other databases
  async postgresQuery(table, operation, data, filters) {
    // Direct PostgreSQL implementation
    throw new Error('PostgreSQL adapter not implemented yet');
  }

  async mongoQuery(table, operation, data, filters) {
    // MongoDB implementation
    throw new Error('MongoDB adapter not implemented yet');
  }
}

module.exports = {
  DatabaseAdapter,
  getDatabaseConfig
};