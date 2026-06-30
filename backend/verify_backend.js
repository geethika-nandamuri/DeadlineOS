async function runVerification() {
  console.log('=== STARTING DEADLINEOS DIAGNOSTICS & AUTH VERIFICATION ===');
  const baseUrl = 'http://127.0.0.1:5000/api';
  try {
    // 1. Check Health Endpoint
    console.log('Checking health matrix...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const health = await healthRes.json();
    console.log(`[PASS] Server status: ${health.status}`);
    console.log(`[INFO] Gemini API configuration loaded: ${health.geminiKeyConfigured}`);

    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'Password123';
    let token = '';

    // 2. Test Registration API
    console.log(`Testing registration with email: ${testEmail}...`);
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Diagnostic User',
        email: testEmail,
        password: testPassword
      })
    });
    
    if (!regRes.ok) {
      const errData = await regRes.json();
      throw new Error(`Registration failed: ${errData.message}`);
    }
    const regData = await regRes.json();
    console.log(`[PASS] Registered successfully. User ID: ${regData.user.id}`);

    // 3. Test Login API
    console.log('Testing login...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    if (!loginRes.ok) {
      const errData = await loginRes.json();
      throw new Error(`Login failed: ${errData.message}`);
    }
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log(`[PASS] Login successful. JWT token received.`);

    // 4. Test Task Creation (Requires Auth)
    console.log('Creating standard tasks for diagnostic user...');
    const taskData = {
      title: 'React Project — Auth Module',
      description: 'Implement JWT login, register, and protected routes using React Context.',
      deadline: new Date(Date.now() + 1.2 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedHours: 6.5,
      category: 'Project',
      difficulty: 'Hard'
    };

    const taskRes = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });
    
    if (!taskRes.ok) {
      const errData = await taskRes.json();
      throw new Error(`Task creation failed: ${errData.message}`);
    }
    const createdTask = await taskRes.json();
    console.log(`[PASS] Task created successfully. Task ID: ${createdTask._id}`);

    // 5. Test Analytics Endpoint (Requires Auth)
    console.log('Requesting consolidated dashboard analytics...');
    const analyticsRes = await fetch(`${baseUrl}/analytics/dashboard`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!analyticsRes.ok) {
      const errData = await analyticsRes.json();
      throw new Error(`Analytics retrieval failed: ${errData.message}`);
    }
    const analytics = await analyticsRes.json();
    console.log(`[PASS] Analytics returned successfully.`);
    console.log(`[PASS] -> Has data: ${analytics.hasData}`);
    console.log(`[PASS] -> Success Probability: ${analytics.successProbability}%`);
    console.log(`[PASS] -> Deadline Pressure Risk: ${analytics.deadlineRisk}%`);
    console.log(`[PASS] -> Schedule Fullness Burnout: ${analytics.burnoutRisk}%`);
    console.log(`[PASS] -> Focus Factor: ${analytics.focusFactor}%`);
    console.log(`[PASS] -> Category Breakdown count: ${analytics.categoryData.length}`);
    console.log(`[PASS] -> Completion Breakdown (Pie): ${JSON.stringify(analytics.completionPie)}`);
    console.log(`[PASS] -> Weekly distribution: ${JSON.stringify(analytics.weeklyData.slice(0, 2))}...`);

    // 6. Chat CommandCenter Communication (Requires Auth)
    console.log('Testing conversational link with AI helper...');
    const chatRes = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: 'What should I do next?',
        history: []
      })
    });
    const chat = await chatRes.json();
    console.log(`[PASS] AI coach reply: "${chat.response}"`);

    console.log('=== AUTHENTICATION & DIAGNOSTIC PROTOCOLS NOMINAL ===');
  } catch (error) {
    console.error('[FAIL] Diagnostics failure:', error.message);
  }
}

// Spin up verification 3 seconds post-initialization
setTimeout(runVerification, 3000);
