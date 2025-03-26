// Script to update user status to Premium
const { createClient } = require('@supabase/supabase-js')

// Use the provided credentials
const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Target email
const targetEmail = 'leandrocristni@gmail.com'

async function updateUserStatus() {
  console.log(`Updating status for user: ${targetEmail}`)
  
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
    
    console.log('User found:', user.id)
    
    // Force update the profile with Premium status
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        expiration_date: '2026-03-26T00:00:00+00:00', // 1 year from now
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Error updating profile:', updateError.message)
      return
    }
    
    console.log('Profile updated successfully!')
    
    // Verify the update
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Error verifying profile update:', profileError.message)
      return
    }
    
    console.log('Updated profile:')
    console.log('Name:', profile.name)
    console.log('Premium status:', profile.is_premium)
    console.log('Expiration date:', profile.expiration_date)
    console.log('Updated at:', profile.updated_at)
    
  } catch (error) {
    console.error('Error in updateUserStatus:', error.message)
  }
}

// Run the update
updateUserStatus()
