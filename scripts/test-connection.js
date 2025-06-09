const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qnuevynptgkoivekuzer.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudWV2eW5wdGdrb2l2ZWt1emVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NzM4MzYsImV4cCI6MjA2NDU0OTgzNn0.z3GzoVvcFXFx1CL1LA3cww_0587aUwrlkZStgQFRrww'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test database connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      throw error
    }
    
    console.log('✅ Successfully connected to Supabase!')
    console.log('Database response:', data)
    
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message)
    process.exit(1)
  }
}

testConnection() 