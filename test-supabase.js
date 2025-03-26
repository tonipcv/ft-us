// Simple script to test Supabase connection
const { createClient } = require('@supabase/supabase-js')

// Use the provided credentials
const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Test function to check connection
async function testConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Try to fetch a user with email leandrocristni@gmail.com
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Error connecting to Supabase:', getUserError.message)
      return
    }
    
    console.log('Successfully connected to Supabase!')
    console.log(`Found ${users.length} users in the database`)
    
    // Check if the specific user exists
    const targetEmail = 'leandrocristni@gmail.com'
    const user = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase())
    
    if (user) {
      console.log(`User with email ${targetEmail} found:`)
      console.log('User ID:', user.id)
      console.log('Email:', user.email)
      console.log('Created at:', user.created_at)
      
      // Try to fetch the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Error fetching profile:', profileError.message)
      } else if (profile) {
        console.log('Profile found:')
        console.log('Name:', profile.name)
        console.log('Premium status:', profile.is_premium ? 'Premium' : 'Normal')
        console.log('Expiration date:', profile.expiration_date)
      } else {
        console.log('No profile found for this user')
      }
    } else {
      console.log(`User with email ${targetEmail} not found`)
    }
  } catch (error) {
    console.error('Error testing connection:', error.message)
  }
}

// Run the test
testConnection()
