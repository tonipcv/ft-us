// Script to check all profiles and find any with matching email
const { createClient } = require('@supabase/supabase-js')

// Use the provided credentials
const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Target email
const targetEmail = 'leandrocristni@gmail.com'
const targetUserId = '327fbf01-b4b1-4096-94cb-92fdddc217d3'

async function checkAllProfiles() {
  console.log(`Checking all profiles for email: ${targetEmail} or ID: ${targetUserId}`)
  
  try {
    // Get all profiles that match either the email or ID
    const { data: emailProfiles, error: emailError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', targetEmail)
    
    if (emailError) {
      console.error('Error searching profiles by email:', emailError.message)
    } else {
      console.log(`Found ${emailProfiles?.length || 0} profiles matching email ${targetEmail}:`)
      if (emailProfiles && emailProfiles.length > 0) {
        emailProfiles.forEach((profile, index) => {
          console.log(`\nProfile #${index + 1} (by email):`)
          console.log(JSON.stringify(profile, null, 2))
        })
      }
    }
    
    // Get profile by ID
    const { data: idProfile, error: idError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
    
    if (idError) {
      console.error('Error searching profile by ID:', idError.message)
    } else {
      console.log(`\nFound ${idProfile?.length || 0} profiles matching ID ${targetUserId}:`)
      if (idProfile && idProfile.length > 0) {
        idProfile.forEach((profile, index) => {
          console.log(`\nProfile #${index + 1} (by ID):`)
          console.log(JSON.stringify(profile, null, 2))
        })
      }
    }
    
    // Simulate how the API would process this
    console.log('\n=== SIMULATING API PROCESSING ===')
    
    // Get all users
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Error fetching users:', getUserError.message)
      return
    }
    
    // Get all profiles
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('Error fetching all profiles:', profilesError.message)
      return
    }
    
    // Find the target user
    const targetUser = users.find(u => u.id === targetUserId)
    
    if (!targetUser) {
      console.log(`User with ID ${targetUserId} not found in auth.users!`)
      return
    }
    
    console.log('Target user found in auth.users:', targetUser.id)
    
    // Find the profile using the same logic as in your API
    const userProfile = allProfiles?.find(profile => profile.id === targetUser.id)
    
    console.log('Profile found using API logic:', userProfile ? 'Yes' : 'No')
    if (userProfile) {
      console.log('Profile details:')
      console.log('ID:', userProfile.id)
      console.log('Name:', userProfile.name)
      console.log('is_premium:', userProfile.is_premium)
      console.log('Type of is_premium:', typeof userProfile.is_premium)
    }
    
    // Check if the profile would be considered premium in the API
    if (userProfile) {
      const isPremium = userProfile.is_premium === true
      console.log('\nWould be considered premium in API:', isPremium)
    }
    
    // Check if there are any profiles with null ID
    const nullIdProfiles = allProfiles?.filter(p => p.id === null)
    console.log(`\nProfiles with null ID: ${nullIdProfiles?.length || 0}`)
    
    // Check if there are any profiles with the target email but different ID
    const wrongIdProfiles = allProfiles?.filter(p => 
      p.email?.toLowerCase() === targetEmail.toLowerCase() && p.id !== targetUserId
    )
    
    console.log(`\nProfiles with target email but wrong ID: ${wrongIdProfiles?.length || 0}`)
    if (wrongIdProfiles && wrongIdProfiles.length > 0) {
      wrongIdProfiles.forEach((profile, index) => {
        console.log(`\nWrong ID Profile #${index + 1}:`)
        console.log(JSON.stringify(profile, null, 2))
      })
    }
    
  } catch (error) {
    console.error('Error in checkAllProfiles:', error.message)
  }
}

// Run the check
checkAllProfiles()
