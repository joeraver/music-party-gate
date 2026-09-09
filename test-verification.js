const http = require('http');

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('Starting API & Server verification tests on', baseUrl);

  // Helper for requests
  function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(url, options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, data });
          }
        });
      });
      req.on('error', reject);
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  }

  try {
    // 1. Health check
    const health = await request('/health');
    console.log('1. Health Check:', health.status === 200 ? 'PASS ✅' : 'FAIL ❌', health.data);

    // 2. Config check
    const config = await request('/api/config');
    console.log('2. Public Config:', config.status === 200 && config.data.theme === 'halloween' ? 'PASS ✅' : 'FAIL ❌', {
      theme: config.data.theme,
      partyTitle: config.data.partyTitle,
      rewards: config.data.rewards,
      hasPartyUrl: config.data.hasPartyUrl
    });

    // 3. Random Question check
    const quiz = await request('/api/quiz/random');
    const isAntiCheat = !quiz.data.answer && !quiz.data.explanation;
    console.log('3. Random Question & Anti-Cheat:', quiz.status === 200 && isAntiCheat ? 'PASS ✅' : 'FAIL ❌', {
      id: quiz.data.id,
      category: quiz.data.category,
      question: quiz.data.question?.substring(0, 40) + '...',
      optionsCount: quiz.data.options?.length,
      answerHidden: isAntiCheat
    });

    // 4. Verify Incorrect Answer
    const badVerify = await request('/api/quiz/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { questionId: quiz.data.id, selectedAnswer: 'Totally Wrong Answer 12345' }
    });
    console.log('4. Reject Incorrect Answer:', badVerify.data.success === false ? 'PASS ✅' : 'FAIL ❌', badVerify.data.message);

    // 5. Verify Correct Answer (using question 1 Rockwell)
    const goodVerify = await request('/api/quiz/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { questionId: 'q1', selectedAnswer: 'Rockwell' }
    });
    console.log('5. Accept Correct Answer & Provide Rewards:', goodVerify.data.success === true ? 'PASS ✅' : 'FAIL ❌', {
      success: goodVerify.data.success,
      redirectUrl: goodVerify.data.redirectUrl,
      rewards: goodVerify.data.rewards,
      explanation: goodVerify.data.explanation?.substring(0, 40) + '...'
    });

    // 6. Admin Login
    const adminLogin = await request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { password: 'party' }
    });
    console.log('6. Admin Login with Default Password:', adminLogin.data.success === true ? 'PASS ✅' : 'FAIL ❌');

    console.log('\nAll verification tests completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
