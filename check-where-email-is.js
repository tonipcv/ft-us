// Check where the email data might be stored
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkWhereEmailIs() {
  console.log('=== CHECKING WHERE EMAIL DATA IS STORED ===\n')
  
  try {
    // Get a sample of profiles without email
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .is('email', null)
      .limit(10)
    
    if (error) {
      console.error('Error:', error.message)
      return
    }
    
    console.log(`Sample of ${profiles.length} profiles without email field:\n`)
    
    profiles.forEach((profile, index) => {
      console.log(`Profile ${index + 1}:`)
      console.log(`  ID: ${profile.id}`)
      console.log(`  Name: ${profile.name || '(no name)'}`)
      console.log(`  Email field: ${profile.email || 'NULL'}`)
      console.log(`  External ID: ${profile.external_id || 'NULL'}`)
      console.log(`  Phone: ${profile.phone_local_code || ''}${profile.phone_number || ''}`)
      console.log(`  Premium: ${profile.is_premium}`)
      console.log(`  Created: ${profile.created_at}`)
      console.log('')
    })
    
    console.log('=== ANALYSIS ===')
    console.log('The email is NOT stored anywhere in these profiles.')
    console.log('These profiles were created without email data.')
    console.log('\nPossible solutions:')
    console.log('1. The email might be in an external system (referenced by external_id)')
    console.log('2. You need to re-import these users with their emails')
    console.log('3. The email was never captured for these users')
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkWhereEmailIs()
