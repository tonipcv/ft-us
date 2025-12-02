// Count profiles with and without emails
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hzqhyzwzrblcjdgjmash.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWh5end6cmJsY2pkZ2ptYXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg2MTQ0MCwiZXhwIjoyMDQ1NDM3NDQwfQ.wakdULASvbGn_94mY1gnB4QjoyKPD0K8_piML5T81kk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function countEmailStatus() {
  console.log('=== COUNTING EMAIL STATUS IN PROFILES ===\n')
  
  try {
    // Count total profiles
    const { count: totalCount, error: totalError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) {
      console.error('Error counting total:', totalError.message)
      return
    }
    
    // Count profiles WITH email
    const { count: withEmailCount, error: withError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('email', 'is', null)
    
    if (withError) {
      console.error('Error counting with email:', withError.message)
      return
    }
    
    // Count profiles WITHOUT email
    const { count: withoutEmailCount, error: withoutError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('email', null)
    
    if (withoutError) {
      console.error('Error counting without email:', withoutError.message)
      return
    }
    
    console.log('📊 STATISTICS:')
    console.log(`Total profiles: ${totalCount}`)
    console.log(`With email: ${withEmailCount} (${((withEmailCount/totalCount)*100).toFixed(1)}%)`)
    console.log(`Without email: ${withoutEmailCount} (${((withoutEmailCount/totalCount)*100).toFixed(1)}%)`)
    
    // Check auth users count
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (!authError) {
      console.log(`\nAuth users: ${users.length}`)
      console.log(`\n⚠️  Gap: ${withoutEmailCount} profiles don't have emails`)
      console.log(`These profiles were likely created with manual UUIDs, not through Supabase Auth.`)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

countEmailStatus()
