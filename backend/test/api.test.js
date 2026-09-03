process.env.NODE_ENV = 'test';
process.env.PORT = '5055';

const assert = require('assert');
const http = require('http');
const { connectDB, disconnectDB } = require('../src/config/db');
const app = require('../src/server');
const User = require('../src/models/User');
const Client = require('../src/models/Client');
const Invoice = require('../src/models/Invoice');

const TEST_PORT = 5055;
let server;
let baseUrl = `http://localhost:${TEST_PORT}/api`;

const request = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function runTests() {
  console.log('====================================================');
  console.log('  STARTING MODERN INVOICING SUITE AUTOMATED TESTS   ');
  console.log('====================================================\n');

  process.env.PORT = TEST_PORT;
  process.env.NODE_ENV = 'test';

  await connectDB();

  // Clear test DB
  await User.deleteMany({});
  await Client.deleteMany({});
  await Invoice.deleteMany({});

  server = app.listen(TEST_PORT);
  console.log(`[Test Server] Running on ${baseUrl}\n`);

  try {
    // 1. Test Health Check
    console.log('TEST 1: Health Check Endpoint');
    const health = await request('GET', '/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.status, 'ok');
    console.log('✓ Health check returned 200 OK\n');

    // 2. Test User Registration (Free User)
    console.log('TEST 2: User Registration (Free User)');
    const freeReg = await request('POST', '/auth/register', {
      name: 'Free Test User',
      email: 'free-test@notary.app',
      password: 'password123',
      role: 'free'
    });
    assert.strictEqual(freeReg.status, 201);
    assert.ok(freeReg.data.token);
    assert.strictEqual(freeReg.data.user.role, 'free');
    const freeToken = freeReg.data.token;
    console.log('✓ Free user successfully registered with JWT token\n');

    // 3. Test User Registration (Premium User)
    console.log('TEST 3: User Registration (Premium User)');
    const premReg = await request('POST', '/auth/register', {
      name: 'Premium Test User',
      email: 'prem-test@notary.app',
      password: 'password123',
      role: 'premium'
    });
    assert.strictEqual(premReg.status, 201);
    assert.strictEqual(premReg.data.user.role, 'premium');
    const premToken = premReg.data.token;
    console.log('✓ Premium user successfully registered with JWT token\n');

    // 4. Test Client Creation
    console.log('TEST 4: Client Creation & Management');
    const clientRes = await request(
      'POST',
      '/clients',
      {
        name: 'Stark Enterprises',
        email: 'billing@stark.com',
        phone: '+1 555 123 4567',
        billingAddress: {
          street: '10880 Malibu Point',
          city: 'Malibu',
          state: 'CA',
          zip: '90265',
          country: 'USA'
        }
      },
      freeToken
    );
    assert.strictEqual(clientRes.status, 201);
    assert.strictEqual(clientRes.data.data.name, 'Stark Enterprises');
    const clientId = clientRes.data.data._id;
    console.log('✓ Client created successfully\n');

    // 5. Test Invoice Creation & Auto-Calculations
    console.log('TEST 5: Invoice Creation with Dynamic Auto-Calculations');
    const invoiceRes = await request(
      'POST',
      '/invoices',
      {
        clientId: clientId,
        invoiceNumber: 'INV-2026-TEST1',
        issueDate: '2026-09-01',
        dueDate: '2026-09-30',
        status: 'draft',
        taxRate: 10,
        items: [
          { description: 'Reactor Calibration', quantity: 2, unitPrice: 500 },
          { description: 'Titanium Coating', quantity: 1, unitPrice: 1000 }
        ],
        notes: 'Priority terms'
      },
      freeToken
    );

    assert.strictEqual(invoiceRes.status, 201);
    const inv = invoiceRes.data.data;
    // Expected: item 1 = 1000, item 2 = 1000 => subtotal = 2000, tax 10% = 200, total = 2200
    assert.strictEqual(inv.subtotal, 2000, 'Subtotal should be 2000');
    assert.strictEqual(inv.taxAmount, 200, 'Tax amount should be 200');
    assert.strictEqual(inv.total, 2200, 'Total should be 2200');
    const invoiceId = inv._id;
    console.log('✓ Invoice created with accurate auto-computed subtotal, tax %, and total\n');

    // 6. Test Unique Invoice Number Index per User
    console.log('TEST 6: Unique Invoice Number Index Constraint');
    const dupRes = await request(
      'POST',
      '/invoices',
      {
        clientId: clientId,
        invoiceNumber: 'INV-2026-TEST1', // Duplicate number!
        dueDate: '2026-09-30',
        taxRate: 10,
        items: [{ description: 'Test', quantity: 1, unitPrice: 100 }]
      },
      freeToken
    );
    assert.strictEqual(dupRes.status, 409, 'Expected 409 Conflict on duplicate invoice number');
    console.log('✓ Duplicate invoice number correctly rejected with HTTP 409\n');

    // 7. Test Invoices Query Filters
    console.log('TEST 7: Invoices List & Filtering (Status, Client, Date)');
    const filterRes = await request('GET', `/invoices?status=draft&clientId=${clientId}`, null, freeToken);
    assert.strictEqual(filterRes.status, 200);
    assert.strictEqual(filterRes.data.count, 1);
    assert.strictEqual(filterRes.data.data[0].status, 'draft');
    console.log('✓ Query filters for status and client successfully returned filtered dataset\n');

    // 8. Test Tier Gating - Free User Attempting Custom Branding (MUST BE 403 FORBIDDEN)
    console.log('TEST 8: CRITICAL - Tiered Gating Security Check');
    const freeBrandingAttempt = await request(
      'PUT',
      '/users/branding',
      { logoPosition: 'top-right' },
      freeToken // Free user!
    );
    assert.strictEqual(
      freeBrandingAttempt.status,
      403,
      'Free tier users MUST receive 403 Forbidden on branding endpoints'
    );
    assert.strictEqual(freeBrandingAttempt.data.upgradeRequired, true);
    console.log('✓ Server strictly enforced HTTP 403 Forbidden on free tier branding endpoint\n');

    // 9. Test Tier Gating - Premium User Custom Branding (MUST SUCCEED)
    console.log('TEST 9: Premium User Branding Access');
    const premBrandingRes = await request(
      'PUT',
      '/users/branding',
      { logoPosition: 'top-right' },
      premToken // Premium user!
    );
    assert.strictEqual(premBrandingRes.status, 200);
    assert.strictEqual(premBrandingRes.data.data.logoPosition, 'top-right');
    console.log('✓ Premium user permitted to update custom branding\n');

    // 10. Test Invoice Details Layout & Data Leakage Prevention
    console.log('TEST 10: Printable Invoice Details & Data Leakage Guard');
    const invoiceDetail = await request('GET', `/invoices/${invoiceId}`, null, freeToken);
    assert.strictEqual(invoiceDetail.status, 200);
    assert.strictEqual(invoiceDetail.data.data.userId.role, 'free');
    assert.strictEqual(
      invoiceDetail.data.data.userId.branding?.logo,
      null,
      'Free user invoice must not leak premium logo data'
    );
    console.log('✓ Free tier invoice verified clean of premium branding data leakage\n');

    // 11. Test Status Transition (Mark as Paid)
    console.log('TEST 11: Invoice Status Transition to Paid');
    const statusRes = await request('PATCH', `/invoices/${invoiceId}/status`, { status: 'paid' }, freeToken);
    assert.strictEqual(statusRes.status, 200);
    assert.strictEqual(statusRes.data.data.status, 'paid');
    console.log('✓ Invoice status transitioned to PAID successfully\n');

    console.log('====================================================');
    console.log('  ALL 11 AUTOMATED VERIFICATION TESTS PASSED (100%) ');
    console.log('====================================================');
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
