// Script to check if email column exists and has data in profiles table
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEmailColumn() {
  console.log('=== CHECKING EMAIL COLUMN IN PROFILES TABLE ===\n')
  
  try {
    // Try to select email column from profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, is_premium')
      .limit(5)
    
    if (error) {
      console.error('❌ Error querying profiles table:', error.message)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Check if it's a column not found error
      if (error.message.includes('column') && error.message.includes('email')) {
        console.log('\n⚠️  EMAIL COLUMN DOES NOT EXIST IN PROFILES TABLE!')
        console.log('You need to add the email column to the profiles table in Supabase.')
        console.log('\nRun this SQL in Supabase SQL Editor:')
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;')
      }
      return
    }
    
    console.log('✅ Successfully queried profiles table with email column')
    console.log(`Found ${data.length} profiles\n`)
    
    // Check each profile
    let withEmail = 0
    let withoutEmail = 0
    
    data.forEach((profile, index) => {
      console.log(`Profile ${index + 1}:`)
      console.log(`  ID: ${profile.id}`)
      console.log(`  Name: ${profile.name || '(no name)'}`)
      console.log(`  Email: ${profile.email || '❌ NULL/EMPTY'}`)
      console.log(`  Premium: ${profile.is_premium}`)
      console.log('')
      
      if (profile.email) {
        withEmail++
      } else {
        withoutEmail++
      }
    })
    
    console.log('=== SUMMARY ===')
    console.log(`Profiles with email: ${withEmail}`)
    console.log(`Profiles without email: ${withoutEmail}`)
    
    if (withoutEmail > 0) {
      console.log('\n⚠️  Some profiles are missing email data!')
      console.log('This is why emails are not showing in the UI.')
      console.log('\nTo fix this, you can either:')
      console.log('1. Re-submit the user via the form (it will update the email)')
      console.log('2. Run a migration script to populate emails from auth.users')
      console.log('3. Run this SQL in Supabase:')
      console.log(`
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
  AND p.email IS NULL;
      `)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkEmailColumn()
