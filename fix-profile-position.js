// Script to fix the profile position issue
const { createClient } = require('@supabase/supabase-js')

// Use the provided credentials
const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Target email and ID
const targetEmail = 'leandrocristni@gmail.com'
const targetUserId = '327fbf01-b4b1-4096-94cb-92fdddc217d3'

async function fixProfilePosition() {
  console.log(`Fixing profile position for user: ${targetEmail}`)
  
  try {
    // First, delete the existing profile
    console.log('Step 1: Deleting existing profile...')
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', targetUserId)
    
    if (deleteError) {
      console.error('Error deleting profile:', deleteError.message)
      return
    }
    
    console.log('Existing profile deleted successfully')
    
    // Now create a new profile - this will be added at the beginning of the table
    console.log('Step 2: Creating new profile...')
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([
        {
          id: targetUserId,
          name: 'Leandro Cristhia',
          email: targetEmail,
          is_premium: true,
          expiration_date: '2026-03-26T00:00:00+00:00',
          phone_number: '999999999',
          phone_local_code: '11',
          external_id: 'SEC_' + Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
    
    if (createError) {
      console.error('Error creating new profile:', createError.message)
      return
    }
    
    console.log('New profile created successfully:', newProfile)
    
    // Verify that the profile can now be found in the first 1000 profiles
    console.log('Step 3: Verifying profile position...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1000)
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError.message)
      return
    }
    
    const foundProfile = profiles?.find(p => p.id === targetUserId)
    
    if (foundProfile) {
      console.log('Success! Profile found in the first 1000 profiles')
      console.log('Profile details:')
      console.log('ID:', foundProfile.id)
      console.log('Name:', foundProfile.name)
      console.log('Email:', foundProfile.email)
      console.log('Premium status:', foundProfile.is_premium)
    } else {
      console.log('Error: Profile still not found in the first 1000 profiles')
    }
    
  } catch (error) {
    console.error('Error in fixProfilePosition:', error.message)
  }
}

// Run the fix
fixProfilePosition()
