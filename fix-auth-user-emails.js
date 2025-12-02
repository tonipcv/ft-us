// Fix emails ONLY for profiles that have corresponding auth.users
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAuthUserEmails() {
  console.log('=== FIXING EMAILS FOR AUTH USERS ONLY ===\n')
  
  try {
    // Get all auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return
    }
    
    console.log(`Found ${users.length} auth users\n`)
    
    let updated = 0
    let alreadyHasEmail = 0
    let noProfile = 0
    
    for (const user of users) {
      if (!user.email) {
        console.log(`⚠️  Auth user ${user.id} has no email, skipping`)
        continue
      }
      
      // Check if profile exists and if it has email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.log(`⚠️  No profile found for auth user: ${user.email}`)
        noProfile++
        continue
      }
      
      if (profile.email) {
        console.log(`✓ ${user.email} - already has email`)
        alreadyHasEmail++
        continue
      }
      
      // Update the profile with email
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          email: user.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (updateError) {
        console.error(`❌ Error updating ${user.email}:`, updateError.message)
      } else {
        console.log(`✅ UPDATED: ${user.email} (${profile.name || 'no name'})`)
        updated++
      }
    }
    
    console.log('\n=== SUMMARY ===')
    console.log(`✅ Successfully updated: ${updated}`)
    console.log(`✓ Already had email: ${alreadyHasEmail}`)
    console.log(`⚠️  No profile found: ${noProfile}`)
    console.log(`Total auth users: ${users.length}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

fixAuthUserEmails()
