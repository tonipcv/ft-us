// Script to diagnose user-profile association issues
const { createClient } = require('@supabase/supabase-js')

// Use the provided credentials
const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Target email
const targetEmail = 'leandrocristni@gmail.com'

async function diagnoseUserProfiles() {
  console.log('=== DIAGNOSING USER-PROFILE ASSOCIATION ISSUES ===')
  
  try {
    // Step 1: Get all users from auth.users
    console.log('\nStep 1: Fetching users from auth.users...')
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Error fetching users:', getUserError.message)
      return
    }
    
    console.log(`Found ${users.length} users in auth.users`)
    
    // Step 2: Get all profiles
    console.log('\nStep 2: Fetching all profiles...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profileError) {
      console.error('Error fetching profiles:', profileError.message)
      return
    }
    
    console.log(`Found ${profiles?.length || 0} profiles in the profiles table`)
    
    // Step 3: Find our target user
    console.log(`\nStep 3: Looking for user with email ${targetEmail}...`)
    const targetUser = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase())
    
    if (!targetUser) {
      console.log(`User with email ${targetEmail} not found!`)
      return
    }
    
    console.log('Target user found:')
    console.log('ID:', targetUser.id)
    console.log('Email:', targetUser.email)
    
    // Step 4: Find the profile for our target user
    console.log('\nStep 4: Looking for profile for target user...')
    const targetProfile = profiles?.find(p => p.id === targetUser.id)
    
    if (!targetProfile) {
      console.log('No profile found for target user!')
      return
    }
    
    console.log('Target profile found:')
    console.log('ID:', targetProfile.id)
    console.log('Name:', targetProfile.name)
    console.log('is_premium:', targetProfile.is_premium)
    console.log('Type of is_premium:', typeof targetProfile.is_premium)
    
    // Step 5: Simulate how the API would process this user
    console.log('\nStep 5: Simulating API processing...')
    
    // Simulate the user object that would be returned by the API
    const simulatedApiUser = {
      id: targetUser.id,
      email: targetUser.email,
      created_at: targetUser.created_at,
      profile: targetProfile
    }
    
    console.log('Simulated API user object:')
    console.log(JSON.stringify(simulatedApiUser, null, 2))
    
    // Check if the profile's is_premium value is being correctly interpreted
    console.log('\nChecking is_premium interpretation:')
    console.log('Raw is_premium value:', targetProfile.is_premium)
    console.log('Boolean interpretation:', Boolean(targetProfile.is_premium))
    console.log('Strict equality check (=== true):', targetProfile.is_premium === true)
    console.log('Strict equality check (=== false):', targetProfile.is_premium === false)
    
    // Step 6: Check for any duplicate profiles
    console.log('\nStep 6: Checking for duplicate profiles...')
    const duplicateProfiles = profiles?.filter(p => p.email?.toLowerCase() === targetEmail.toLowerCase())
    
    if (duplicateProfiles && duplicateProfiles.length > 1) {
      console.log(`WARNING: Found ${duplicateProfiles.length} profiles with the same email!`)
      duplicateProfiles.forEach((profile, index) => {
        console.log(`\nDuplicate Profile #${index + 1}:`)
        console.log('ID:', profile.id)
        console.log('Name:', profile.name)
        console.log('is_premium:', profile.is_premium)
        console.log('Created at:', profile.created_at)
        console.log('Updated at:', profile.updated_at)
      })
    } else {
      console.log('No duplicate profiles found')
    }
    
    // Step 7: Try to update the profile with explicit boolean
    console.log('\nStep 7: Updating profile with explicit boolean...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_premium: true,  // Explicitly set to boolean true
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUser.id)
    
    if (updateError) {
      console.error('Error updating profile:', updateError.message)
    } else {
      console.log('Profile updated successfully with explicit boolean true')
    }
    
    // Verify the update
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUser.id)
      .single()
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError.message)
    } else {
      console.log('\nVerified updated profile:')
      console.log('is_premium:', updatedProfile.is_premium)
      console.log('Type of is_premium:', typeof updatedProfile.is_premium)
    }
    
  } catch (error) {
    console.error('Error in diagnoseUserProfiles:', error.message)
  }
}

// Run the diagnosis
diagnoseUserProfiles()
