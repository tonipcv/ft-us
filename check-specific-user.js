// Check specific user: angelocaique1996@gmail.com
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUser() {
  const targetEmail = 'angelocaique1996@gmail.com'
  
  console.log(`=== CHECKING USER: ${targetEmail} ===\n`)
  
  try {
    // Check in auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError.message)
      return
    }
    
    const authUser = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase())
    
    if (!authUser) {
      console.log('❌ User NOT found in auth.users')
      return
    }
    
    console.log('✅ User found in auth.users:')
    console.log(`  ID: ${authUser.id}`)
    console.log(`  Email: ${authUser.email}`)
    console.log('')
    
    // Check in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    if (profileError) {
      console.log('❌ Profile NOT found in profiles table')
      console.log('Error:', profileError.message)
      return
    }
    
    console.log('✅ Profile found in profiles table:')
    console.log(JSON.stringify(profile, null, 2))
    console.log('')
    
    if (!profile.email) {
      console.log('⚠️  PROBLEM FOUND: Profile exists but email field is NULL!')
      console.log('This is why the email is not showing in the UI.')
      console.log('\nThe recent code change should fix this on the next update.')
      console.log('To fix it now, re-submit this user through the form.')
    } else {
      console.log('✅ Profile has email field populated correctly')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkUser()
