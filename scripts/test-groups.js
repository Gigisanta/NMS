async function testGroups() {
  try {
    const response = await fetch('http://localhost:3000/api/groups', {
      method: 'GET',
    });
    const result = await response.json();
    console.log('Groups Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Fetch Error:', error);
  }
}

testGroups();
