// Script to simulate exactly what happens in the API
const { createClient } = require('@supabase/supabase-js')

// Use the provided credentials
const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Target email and ID
const targetEmail = 'leandrocristni@gmail.com'
const targetUserId = '327fbf01-b4b1-4096-94cb-92fdddc217d3'

async function simulateApi() {
  console.log('=== SIMULATING EXACT API BEHAVIOR ===')
  
  try {
    // Step 1: Fetch all users (like in the API)
    console.log('\nStep 1: Fetching all users...')
    let allUsers = []
    let currentPage = 0
    let hasMore = true

    while (hasMore) {
      const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers({
        page: currentPage,
        perPage: 1000 // Maximum allowed by Supabase
      })
      
      if (getUserError) {
        console.error('Error fetching users:', getUserError.message)
        return
      }

      if (!users || users.length === 0) {
        hasMore = false
      } else {
        allUsers = [...allUsers, ...users]
        currentPage++
      }
    }
    
    console.log(`Found ${allUsers.length} total users`)
    
    // Step 2: Fetch all profiles (like in the API)
    console.log('\nStep 2: Fetching all profiles...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')

    if (profileError) {
      console.error('Error fetching profiles:', profileError.message)
      return
    }
    
    console.log(`Found ${profiles?.length || 0} total profiles`)
    
    // Step 3: Find our target user
    console.log('\nStep 3: Finding target user...')
    const targetUser = allUsers.find(u => u.id === targetUserId)
    
    if (!targetUser) {
      console.log(`User with ID ${targetUserId} not found!`)
      return
    }
    
    console.log('Target user found:')
    console.log('ID:', targetUser.id)
    console.log('Email:', targetUser.email)
    
    // Step 4: Find the profile using the same logic as in the API
    console.log('\nStep 4: Finding profile for target user (API logic)...')
    const targetProfile = profiles?.find(profile => profile.id === targetUser.id)
    
    if (!targetProfile) {
      console.log('No profile found for target user using API logic!')
      
      // Let's try to understand why by examining all profiles
      console.log('\nExamining profiles to understand why...')
      
      // Check if any profile has the target ID
      const idMatches = profiles?.filter(p => p.id === targetUserId)
      console.log(`Profiles with ID '${targetUserId}': ${idMatches?.length || 0}`)
      
      if (idMatches && idMatches.length > 0) {
        console.log('First matching profile:')
        console.log(JSON.stringify(idMatches[0], null, 2))
      }
      
      // Check if any profile has the target email
      const emailMatches = profiles?.filter(p => p.email?.toLowerCase() === targetEmail.toLowerCase())
      console.log(`Profiles with email '${targetEmail}': ${emailMatches?.length || 0}`)
      
      if (emailMatches && emailMatches.length > 0) {
        console.log('First matching profile:')
        console.log(JSON.stringify(emailMatches[0], null, 2))
      }
      
      // Check for type issues - maybe the ID is stored differently
      console.log('\nChecking for type issues...')
      console.log('Target user ID type:', typeof targetUserId)
      
      if (profiles && profiles.length > 0) {
        console.log('Sample profile ID type:', typeof profiles[0].id)
        
        // Try different comparison methods
        const strictMatch = profiles.find(p => p.id === targetUserId)
        const looseMatch = profiles.find(p => p.id == targetUserId)
        const stringMatch = profiles.find(p => String(p.id) === String(targetUserId))
        
        console.log('Strict equality match (===):', !!strictMatch)
        console.log('Loose equality match (==):', !!looseMatch)
        console.log('String conversion match:', !!stringMatch)
      }
      
      // Check for case sensitivity issues
      const caseInsensitiveMatch = profiles?.find(
        p => p.id?.toLowerCase?.() === targetUserId.toLowerCase()
      )
      console.log('Case-insensitive match:', !!caseInsensitiveMatch)
      
      // Check if the profile exists directly using a query
      const { data: directProfile, error: directError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()
      
      console.log('\nDirect query for profile:')
      if (directError) {
        console.log('Error:', directError.message)
      } else if (directProfile) {
        console.log('Profile found directly!')
        console.log(JSON.stringify(directProfile, null, 2))
      } else {
        console.log('No profile found with direct query')
      }
      
      return
    }
    
    console.log('Target profile found:')
    console.log('ID:', targetProfile.id)
    console.log('Name:', targetProfile.name)
    console.log('is_premium:', targetProfile.is_premium)
    
    // Step 5: Create the user object that would be returned by the API
    console.log('\nStep 5: Creating user object for API response...')
    const apiUser = {
      id: targetUser.id,
      email: targetUser.email,
      created_at: targetUser.created_at,
      profile: targetProfile
    }
    
    console.log('API user object:')
    console.log(JSON.stringify(apiUser, null, 2))
    
    // Step 6: Check if the user would be considered premium
    console.log('\nStep 6: Checking premium status...')
    const isPremium = apiUser.profile?.is_premium === true
    console.log('Would be considered premium:', isPremium)
    
  } catch (error) {
    console.error('Error in simulateApi:', error.message)
  }
}

// Run the simulation
simulateApi()
