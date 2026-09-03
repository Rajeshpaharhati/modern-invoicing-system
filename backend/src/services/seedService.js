const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');

// Sample SVG logo data URI for the demo premium user
const SAMPLE_PREMIUM_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60"><rect width="240" height="60" rx="8" fill="%232563eb"/><path d="M25 15 L35 35 L45 20 L55 45" stroke="%23ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="70" y="38" font-family="Inter, sans-serif" font-size="20" font-weight="bold" fill="%23ffffff">APEX DIGITAL</text></svg>`;

const seedDatabase = async () => {
  try {
    console.log('[Seed] Checking if database needs initial demo data...');
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[Seed] Database already contains ${userCount} users. Skipping auto-seed.`);
      return;
    }

    console.log('[Seed] Populating initial demo accounts & sample data...');

    // 1. Create Free User
    const freeUser = await User.create({
      name: 'Alex Vance (Free Tier)',
      email: 'free@notary.app',
      password: 'password123',
      role: 'free',
      branding: {
        companyName: 'Vance Consulting LLC',
        companyAddress: '100 Market Street, San Francisco, CA 94105',
        companyPhone: '+1 (555) 234-5678',
        logoPosition: 'top-left',
        logo: null
      }
    });

    // 2. Create Premium User
    const premiumUser = await User.create({
      name: 'Morgan Blake (Premium Tier)',
      email: 'premium@notary.app',
      password: 'password123',
      role: 'premium',
      branding: {
        companyName: 'Apex Digital Studio',
        companyAddress: '450 Lexington Ave, 12th Floor, New York, NY 10017',
        companyPhone: '+1 (212) 890-4321',
        logoPosition: 'top-right',
        logo: SAMPLE_PREMIUM_LOGO
      }
    });

    // 3. Create Sample Clients for Free User
    const client1 = await Client.create({
      userId: freeUser._id,
      name: 'Horizon Labs',
      email: 'billing@horizonlabs.io',
      phone: '+1 (415) 555-0199',
      billingAddress: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        zip: '97477',
        country: 'United States'
      }
    });

    const client2 = await Client.create({
      userId: freeUser._id,
      name: 'Starlight Media Co.',
      email: 'accounts@starlight.co',
      phone: '+1 (312) 555-4821',
      billingAddress: {
        street: '120 North Michigan Ave',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        country: 'United States'
      }
    });

    // 4. Create Invoices for Free User
    await Invoice.create({
      userId: freeUser._id,
      clientId: client1._id,
      invoiceNumber: 'INV-2026-001',
      items: [
        { description: 'Cloud Architecture Consultation', quantity: 12, unitPrice: 150, amount: 1800 },
        { description: 'Kubernetes Cluster Deployment', quantity: 1, unitPrice: 2200, amount: 2200 }
      ],
      subtotal: 4000,
      taxRate: 10,
      taxAmount: 400,
      total: 4400,
      issueDate: new Date('2026-08-15'),
      dueDate: new Date('2026-09-15'),
      status: 'paid',
      notes: 'Thank you for your business! Payment received via wire transfer.'
    });

    await Invoice.create({
      userId: freeUser._id,
      clientId: client2._id,
      invoiceNumber: 'INV-2026-002',
      items: [
        { description: 'SEO Performance Audit', quantity: 1, unitPrice: 850, amount: 850 },
        { description: 'Monthly Content Strategy Maintenance', quantity: 2, unitPrice: 600, amount: 1200 }
      ],
      subtotal: 2050,
      taxRate: 8,
      taxAmount: 164,
      total: 2214,
      issueDate: new Date('2026-08-28'),
      dueDate: new Date('2026-09-12'),
      status: 'sent',
      notes: 'Please remit payment within 15 days of invoice date.'
    });

    // 5. Create Sample Clients for Premium User
    const client3 = await Client.create({
      userId: premiumUser._id,
      name: 'Acme Global Ventures',
      email: 'finance@acmeglobal.com',
      phone: '+1 (800) 555-0144',
      billingAddress: {
        street: '350 5th Avenue, Suite 4800',
        city: 'New York',
        state: 'NY',
        zip: '10118',
        country: 'United States'
      }
    });

    const client4 = await Client.create({
      userId: premiumUser._id,
      name: 'Cyberdyne Systems',
      email: 'invoicing@cyberdyne.tech',
      phone: '+1 (408) 555-8822',
      billingAddress: {
        street: '18144 El Camino Real',
        city: 'Sunnyvale',
        state: 'CA',
        zip: '94087',
        country: 'United States'
      }
    });

    // 6. Create Invoices for Premium User
    await Invoice.create({
      userId: premiumUser._id,
      clientId: client3._id,
      invoiceNumber: 'INV-2026-101',
      items: [
        { description: 'Enterprise Brand Identity Redesign', quantity: 1, unitPrice: 7500, amount: 7500 },
        { description: 'Design System & Component Library Tokens', quantity: 1, unitPrice: 4200, amount: 4200 },
        { description: 'Executive Presentation Deck Templates', quantity: 5, unitPrice: 350, amount: 1750 }
      ],
      subtotal: 13450,
      taxRate: 8.875,
      taxAmount: 1193.69,
      total: 14643.69,
      issueDate: new Date('2026-08-10'),
      dueDate: new Date('2026-08-30'),
      status: 'paid',
      notes: 'Premium Client - Priority net-20 terms applied.'
    });

    await Invoice.create({
      userId: premiumUser._id,
      clientId: client4._id,
      invoiceNumber: 'INV-2026-102',
      items: [
        { description: 'AI Agent Interface Prototyping', quantity: 3, unitPrice: 3000, amount: 9000 },
        { description: 'Motion Design & Micro-interactions', quantity: 1, unitPrice: 2500, amount: 2500 }
      ],
      subtotal: 11500,
      taxRate: 9,
      taxAmount: 1035,
      total: 12535,
      issueDate: new Date('2026-08-20'),
      dueDate: new Date('2026-09-01'),
      status: 'overdue',
      notes: 'Notice: This invoice is overdue. Please settle immediately.'
    });

    console.log('[Seed] Demo data successfully initialized:');
    console.log('       Free User:    free@notary.app / password123 (Role: free)');
    console.log('       Premium User: premium@notary.app / password123 (Role: premium, with Logo)');
  } catch (error) {
    console.error('[Seed] Error populating demo data:', error);
  }
};

module.exports = { seedDatabase };
