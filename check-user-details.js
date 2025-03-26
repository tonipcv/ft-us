// Detailed script to check user data in Supabase
const { createClient } = require('@supabase/supabase-js')

// Use the provided credentials
const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Target email
const targetEmail = 'leandrocristni@gmail.com'

async function checkUserDetails() {
  console.log(`Checking detailed information for user: ${targetEmail}`)
  
  try {
    // Get the user from auth.users
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Error fetching users:', getUserError.message)
      return
    }
    
    const user = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase())
    
    if (!user) {
      console.log(`User with email ${targetEmail} not found in auth.users`)
      return
    }
    
    console.log('=== USER DETAILS FROM AUTH ===')
    console.log('User ID:', user.id)
    console.log('Email:', user.email)
    console.log('Created at:', user.created_at)
    console.log('User metadata:', JSON.stringify(user.user_metadata, null, 2))
    
    // Check if there are multiple profiles for this user
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError.message)
      return
    }
    
    console.log(`\n=== PROFILE DATA (Found ${profiles?.length || 0} profiles) ===`)
    
    if (profiles && profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`\nPROFILE #${index + 1}:`)
        console.log('ID:', profile.id)
        console.log('Name:', profile.name)
        console.log('Email:', profile.email)
        console.log('Premium status:', profile.is_premium)
        console.log('Raw is_premium value:', JSON.stringify(profile.is_premium))
        console.log('Expiration date:', profile.expiration_date)
        console.log('Created at:', profile.created_at)
        console.log('Updated at:', profile.updated_at)
        console.log('External ID:', profile.external_id)
      })
    } else {
      console.log('No profiles found for this user')
    }
    
    // Check if there are any entries in other tables for this user
    console.log('\n=== CHECKING FOR RELATED DATA ===')
    
    // Example: Check if there are any entries in a subscriptions table (if it exists)
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
    
    if (!subscriptionsError && subscriptions) {
      console.log(`Found ${subscriptions.length} subscription records`)
      subscriptions.forEach((sub, index) => {
        console.log(`\nSUBSCRIPTION #${index + 1}:`)
        console.log(JSON.stringify(sub, null, 2))
      })
    } else if (subscriptionsError && subscriptionsError.code !== 'PGRST116') {
      // PGRST116 means the table doesn't exist, which is fine
      console.log('Subscription table check:', subscriptionsError.message)
    } else {
      console.log('No subscription records found or table does not exist')
    }
    
    // Try to run a direct SQL query to see the raw data
    const { data: rawData, error: rawError } = await supabase.rpc('get_user_details', { 
      user_email: targetEmail 
    })
    
    if (!rawError && rawData) {
      console.log('\n=== RAW DATA FROM CUSTOM FUNCTION ===')
      console.log(JSON.stringify(rawData, null, 2))
    } else if (rawError && rawError.code !== 'PGRST302') {
      // PGRST302 means the function doesn't exist, which is fine
      console.log('Raw data check:', rawError.message)
    } else {
      console.log('No custom function available for raw data check')
    }
    
  } catch (error) {
    console.error('Error in checkUserDetails:', error.message)
  }
}

// Run the check
checkUserDetails()
