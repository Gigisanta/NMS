async function test() {
  try {
    const response = await fetch('http://localhost:3000/api/debug/clients');
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
  }
}
test();
