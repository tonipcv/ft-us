// Script to create a profile for the user
const { createClient } = require('@supabase/supabase-js')

// Use the provided credentials
const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Target email
const targetEmail = 'leandrocristni@gmail.com'

async function createUserProfile() {
  console.log(`Creating profile for user with email: ${targetEmail}`)
  
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
    
    // Check if a profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (!checkError && existingProfile) {
      console.log('Profile already exists:', existingProfile)
      
      // Update the existing profile to Premium
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          expiration_date: '2026-03-26T00:00:00+00:00', // 1 year from now
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
      
      if (updateError) {
        console.error('Error updating profile:', updateError.message)
        return
      }
      
      console.log('Profile updated successfully:', updateData)
      return
    }
    
    // Create a new profile
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          name: user.user_metadata?.name || 'Leandro Cristhia',
          email: user.email,
          is_premium: true,
          expiration_date: '2026-03-26T00:00:00+00:00', // 1 year from now
          phone_number: '999999999',
          phone_local_code: '11',
          external_id: 'SEC_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
    
    if (createError) {
      console.error('Error creating profile:', createError.message)
      return
    }
    
    console.log('Profile created successfully:', newProfile)
    
  } catch (error) {
    console.error('Error in createUserProfile:', error.message)
  }
}

// Run the function
createUserProfile()
