
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const userId = 'aa291173-aa56-4e69-8342-921d07936316';

async function testApi() {
  try {
    // Test 1: Organizations query (what your app does)
    console.log('\n=== Test 1: getOrganizationMembers (via API) ===');
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select(`
        role,
        organization:organization_id (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', userId);

    if (membersError) {
      console.error('ERROR:', JSON.stringify(membersError, null, 2));
    } else {
      console.log('SUCCESS - Members count:', members.length);
      console.log('Data:', JSON.stringify(members, null, 2));
    }

    // Test 2: Direct getOrganizationBoards call
    if (members && members.length > 0) {
      const orgId = members[0].organization.id;
      console.log('\n=== Test 2: getOrganizationBoards ===');
      const { data: boards, error: boardsError } = await supabase
        .from('boards')
        .select('*')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false });

      if (boardsError) {
        console.error('ERROR:', JSON.stringify(boardsError, null, 2));
      } else {
        console.log('SUCCESS - Boards count:', boards.length);
        console.log('Data:', JSON.stringify(boards, null, 2));
      }
    }

  } catch (err) {
    console.error('Script error:', err);
  }
}

testApi();
