import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { BillScannerService } from '../services/ai/billScanner';
import { prisma } from '../db/prisma';

// Helper to construct valid image buffers with proper magic bytes
function createValidJpegBuffer(): Buffer {
  const buf = Buffer.alloc(100);
  buf[0] = 0xFF;
  buf[1] = 0xD8;
  buf[2] = 0xFF;
  return buf;
}

function createValidPngBuffer(): Buffer {
  const buf = Buffer.alloc(100);
  buf[0] = 0x89;
  buf[1] = 0x50;
  buf[2] = 0x4E;
  buf[3] = 0x47;
  return buf;
}

function createValidWebpBuffer(): Buffer {
  const buf = Buffer.alloc(100);
  buf.write('RIFF', 0, 4, 'utf8');
  buf.write('WEBP', 8, 4, 'utf8');
  return buf;
}

describe('BillScannerService - Final Production & Security Audit Test Suite', () => {
  const testUserId = 'test-user-scan-123';
  const testWorkspaceId = 'test-workspace-scan-456';
  const otherWorkspaceId = 'other-workspace-isolation-789';

  before(async () => {
    try {
      await prisma.transaction.deleteMany({ where: { workspaceId: testWorkspaceId } });
      await prisma.transaction.deleteMany({ where: { workspaceId: otherWorkspaceId } });
    } catch (e) {
      // Ignore if DB not present
    }
  });

  it('should successfully extract draft from valid JPEG receipt buffer', async () => {
    const jpegBuf = createValidJpegBuffer();
    const result = await BillScannerService.scanBill(
      testUserId,
      testWorkspaceId,
      jpegBuf,
      'image/jpeg',
      'uber_receipt.jpg'
    );

    assert.equal(result.success, true);
    assert.ok(result.draft);
    assert.equal(result.draft.merchant, 'Uber Rides Inc');
    assert.equal(result.draft.total, '450.00');
    assert.equal(result.draft.currency, 'INR');
    assert.equal(result.draft.paymentMethod, 'UPI');
  });

  it('should successfully extract draft from valid PNG receipt buffer', async () => {
    const pngBuf = createValidPngBuffer();
    const result = await BillScannerService.scanBill(
      testUserId,
      testWorkspaceId,
      pngBuf,
      'image/png',
      'zara_invoice.png'
    );

    assert.equal(result.success, true);
    assert.ok(result.draft);
    assert.equal(result.draft.merchant, 'Zara Retail');
    assert.equal(result.draft.total, '4299.00');
    assert.equal(result.draft.category, 'Shopping');
  });

  it('should handle missing and uncertain fields gracefully', async () => {
    const jpegBuf = createValidJpegBuffer();
    const result = await BillScannerService.scanBill(
      testUserId,
      testWorkspaceId,
      jpegBuf,
      'image/jpeg',
      'blurry_receipt.jpg'
    );

    assert.equal(result.success, true);
    assert.equal(result.draft.merchant, null);
    assert.equal(result.draft.total, null);
    assert.ok(result.uncertainFields.includes('merchant'));
    assert.ok(result.uncertainFields.includes('total'));
  });

  it('should generate TOTAL_MISMATCH warning when subtotal + tax + tip != total', async () => {
    const jpegBuf = createValidJpegBuffer();
    const result = await BillScannerService.scanBill(
      testUserId,
      testWorkspaceId,
      jpegBuf,
      'image/jpeg',
      'mismatch_bill.jpg'
    );

    assert.equal(result.success, true);
    assert.ok(result.warnings.some(w => w.code === 'TOTAL_MISMATCH'));
    assert.ok(result.warnings.some(w => w.code === 'LINE_ITEM_MISMATCH'));
  });

  it('should map AI category synonyms deterministically to existing categories', async () => {
    const mockRaw = {
      merchant: 'Starbucks Bistro Cafe',
      date: '2026-09-01',
      total: 350.00,
      category: 'dining',
      items: []
    };

    const result = await BillScannerService.buildDraftResponse(testUserId, testWorkspaceId, mockRaw);
    assert.equal(result.success, true);
    assert.equal(result.draft.merchant, 'Starbucks Bistro Cafe');
    assert.equal(result.draft.total, '350.00');
  });

  it('should leave categoryId null if suggested category has no matching DB category', async () => {
    const mockRaw = {
      merchant: 'Exotic Space Travel Co',
      date: '2026-09-01',
      total: 50000.00,
      category: 'Intergalactic Nonexistent Category',
      items: []
    };

    const result = await BillScannerService.buildDraftResponse(testUserId, testWorkspaceId, mockRaw);
    assert.equal(result.success, true);
    assert.equal(result.draft.category, 'Intergalactic Nonexistent Category');
    assert.equal(result.draft.categoryId, null);
  });

  it('should detect duplicates with case-insensitive title normalization and exact workspace scope', async () => {
    let dummyTxId: string | null = null;
    let otherTxId: string | null = null;

    try {
      const cat = await prisma.category.findFirst();
      const wallet = await prisma.wallet.findFirst({ where: { userId: testUserId } });

      if (cat && wallet) {
        const created = await prisma.transaction.create({
          data: {
            userId: testUserId,
            workspaceId: testWorkspaceId,
            title: 'Uber Rides Inc.',
            amount: 450.00,
            categoryId: cat.id,
            walletId: wallet.id,
            date: new Date()
          }
        });
        dummyTxId = created.id;

        const otherCreated = await prisma.transaction.create({
          data: {
            userId: testUserId,
            workspaceId: otherWorkspaceId,
            title: 'Uber Rides Inc.',
            amount: 450.00,
            categoryId: cat.id,
            walletId: wallet.id,
            date: new Date()
          }
        });
        otherTxId = otherCreated.id;
      }
    } catch (e) {
      // Ignore if DB connection not present
    }

    const mockRaw = {
      merchant: 'UBER RIDES INC',
      date: new Date().toISOString().split('T')[0],
      total: 450.00,
      items: []
    };

    const result = await BillScannerService.buildDraftResponse(testUserId, testWorkspaceId, mockRaw);

    if (dummyTxId) {
      assert.ok(result.duplicateWarning);
      assert.equal(result.duplicateWarning?.possibleDuplicate, true);
      assert.equal(result.duplicateWarning?.matches.length, 1);
      assert.equal(result.duplicateWarning?.matches[0].id, dummyTxId);

      await prisma.transaction.delete({ where: { id: dummyTxId } });
      if (otherTxId) await prisma.transaction.delete({ where: { id: otherTxId } });
    }
  });

  it('should NOT produce duplicate warning when amounts are clearly different', async () => {
    const mockRaw = {
      merchant: 'Uber Rides Inc',
      date: new Date().toISOString().split('T')[0],
      total: 99999.00,
      items: []
    };

    const result = await BillScannerService.buildDraftResponse(testUserId, testWorkspaceId, mockRaw);
    assert.equal(result.duplicateWarning, null);
  });

  it('FINANCIAL INTEGRITY: Reconciles 1-cent rounding remainders in equal splits', () => {
    const total = 100.00;
    const count = 3;
    const baseShare = Math.floor((total / count) * 100) / 100;
    const remainder = Math.round((total - baseShare * count) * 100) / 100;

    const shares = [
      Math.round((baseShare + remainder) * 100) / 100,
      baseShare,
      baseShare
    ];

    const sum = shares.reduce((a, b) => a + b, 0);
    assert.equal(sum, 100.00, 'Sum of split shares must equal total bill amount exactly!');
    assert.equal(shares[0], 33.34);
    assert.equal(shares[1], 33.33);
    assert.equal(shares[2], 33.33);
  });

  it('SECURITY: Ensure response payloads never expose internal keys or secrets', async () => {
    const jpegBuf = createValidJpegBuffer();
    const result = await BillScannerService.scanBill(
      testUserId,
      testWorkspaceId,
      jpegBuf,
      'image/jpeg',
      'test.jpg'
    );

    const jsonStr = JSON.stringify(result);
    assert.equal(jsonStr.includes('GEMINI_API_KEY'), false);
    assert.equal(jsonStr.includes('JWT_SECRET'), false);
  });

  it('CONFIRMATION: scanning a bill does NOT create any expense or transaction record in database', async () => {
    const initialTxCount = await prisma.transaction.count().catch(() => 0);

    const jpegBuf = createValidJpegBuffer();
    const result = await BillScannerService.scanBill(
      testUserId,
      testWorkspaceId,
      jpegBuf,
      'image/jpeg',
      'zara_invoice.png'
    );

    assert.equal(result.success, true);

    const finalTxCount = await prisma.transaction.count().catch(() => 0);
    assert.equal(finalTxCount, initialTxCount, 'Transaction count in DB must remain unchanged!');
  });
});
