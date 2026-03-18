async function test() {
  try {
    const res = await fetch('http://localhost:4000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test400@test.com', password: 'password' })
    });
    const data = await res.json();
    console.log("Signup:", res.status, data);

    const res2 = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test400@test.com', password: 'password' })
    });
    const data2 = await res2.json();
    console.log("Login:", res2.status, data2);
  } catch(e) { console.error(e); }
}
test();
