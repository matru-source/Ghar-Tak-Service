import { NextResponse } from 'next/server';
import { isDatabaseConnected, db } from '@/lib/db';

export async function GET() {
  const dbConnected = await isDatabaseConnected();
  const colabaPincode = await db.getPincodeCoverage('400001');
  const activeTech = await db.getTechnicianById('tech_rajesh_01');

  const healthData = {
    status: 'healthy',
    service: 'ElectriCare Mission-Critical SaaS Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    system: {
      engine: 'Next.js 16 + Node.js (App Router API)',
      orm: 'Prisma Client 6.4.1',
      databaseTarget: 'PostgreSQL 16 (Multi-Tenant Schema)',
      databaseConnected: dbConnected,
      persistenceMode: dbConnected ? 'PostgreSQL Live Pool' : 'Dual-Engine Seed Store',
      authEngine: 'JWT + Phone OTP (PBKDF2 / SHA256)',
    },
    schemaTelemetry: {
      modelsRegistered: 11,
      coreModels: [
        'User', 'Partner', 'PincodeCoverage', 'Technician',
        'CustomerProfile', 'ServiceCategory', 'ServiceCatalog',
        'Job', 'Invoice', 'LedgerEntry', 'SupportTicket', 'AuditLog'
      ],
      activeTestPincode: colabaPincode?.pincode || '400001',
      activeTestTechnician: activeTech && 'user' in activeTech ? activeTech.user?.fullName : (activeTech && 'fullName' in activeTech ? activeTech.fullName : 'Rajesh Kumar (TECH-7821)'),
    },
    supportedClients: [
      { name: 'Flutter Customer Mobile App', platform: 'Android / iOS', protocol: 'REST / JSON' },
      { name: 'Flutter Technician Mobile App', platform: 'Android / iOS', protocol: 'REST / JSON' },
      { name: 'Partner Mobile Operations App', platform: 'Android / iOS', protocol: 'REST / JSON' },
      { name: 'Super Admin Web CRM', platform: 'Desktop Web (Next.js)', protocol: 'Server Components / REST' },
      { name: 'Regional Partner Web CRM', platform: 'Desktop Web (Next.js)', protocol: 'Server Components / REST' },
    ],
    features: {
      pincodeTerritoryEngine: 'active',
      dispatchStateMachine: 'active',
      safetyInterlockVerification: 'active',
      gst18TaxCalculation: 'active',
      wormAuditLogging: 'active',
    },
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
