async function testApi() {
  try {
    const response = await fetch('http://localhost:3000/api/clients', {
      method: 'GET',
    });
    const result = await response.json();
    console.log('API Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Fetch Error:', error);
  }
}

testApi();
