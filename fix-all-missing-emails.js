// Script to populate all missing emails in profiles table from auth.users
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAllMissingEmails() {
  console.log('=== FIXING ALL MISSING EMAILS ===\n')
  
  try {
    // Get all auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return
    }
    
    console.log(`Found ${users.length} users in auth.users\n`)
    
    // Get all profiles with missing emails
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .is('email', null)
    
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError.message)
      return
    }
    
    console.log(`Found ${profiles.length} profiles with missing emails\n`)
    
    if (profiles.length === 0) {
      console.log('✅ All profiles already have emails!')
      return
    }
    
    // Update each profile
    let updated = 0
    let notFound = 0
    
    for (const profile of profiles) {
      const authUser = users.find(u => u.id === profile.id)
      
      if (!authUser || !authUser.email) {
        console.log(`⚠️  No auth user found for profile ID: ${profile.id}`)
        notFound++
        continue
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          email: authUser.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
      
      if (updateError) {
        console.error(`❌ Error updating profile ${profile.id}:`, updateError.message)
      } else {
        console.log(`✅ Updated profile: ${profile.name || '(no name)'} -> ${authUser.email}`)
        updated++
      }
    }
    
    console.log('\n=== SUMMARY ===')
    console.log(`✅ Successfully updated: ${updated}`)
    console.log(`⚠️  Not found in auth: ${notFound}`)
    console.log(`Total processed: ${profiles.length}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

fixAllMissingEmails()
