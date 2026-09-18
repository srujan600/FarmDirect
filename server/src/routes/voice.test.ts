import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../app.js';
import { VoiceService } from '../services/voice.service.js';

describe('AgriDirect Vernacular Voice AI & Slot Normalization Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('Unit: normalizeIndicNumerals converts Indic script numerals to standard digits', () => {
    // Devanagari (१० -> 10)
    assert.equal(VoiceService.normalizeIndicNumerals('१० क्विंटल'), '10 क्विंटल');
    // Gurmukhi (੨੦ -> 20)
    assert.equal(VoiceService.normalizeIndicNumerals('੨੦ ਕੁਇੰਟਲ'), '20 ਕੁਇੰਟਲ');
    // Gujarati (૫ -> 5)
    assert.equal(VoiceService.normalizeIndicNumerals('૫ મણ કપાસ'), '5 મણ કપાસ');
    // Telugu (౧౫ -> 15)
    assert.equal(VoiceService.normalizeIndicNumerals('౧౫ క్వింటాళ్లు'), '15 క్వింటాళ్లు');
  });

  test('Unit: extractAgriSlots parses Marathi dialect with Devanagari numerals and Quintal units', () => {
    const res = VoiceService.extractAgriSlots('१० क्विंटल गावरान टोमॅटो, ३५ रुपये किलो', 'mr');
    assert.equal(res.crop_name, 'Nashik Hybrid Tomato');
    assert.equal(res.category, 'VEGETABLES');
    assert.equal(res.quantity_quintals, 10);
    assert.equal(res.quantity_kg, 1000);
    assert.equal(res.expected_price_per_kg, 35);
    assert.ok(res.confirmation_prompt.includes('10 क्विंटल Nashik Hybrid Tomato'));
  });

  test('Unit: extractAgriSlots parses Hindi dialect with quintal units and rate keywords', () => {
    const res = VoiceService.extractAgriSlots('५ क्विंटल हाइब्रिड प्याज, २५ रुपये प्रति किलो', 'hi');
    assert.equal(res.crop_name, 'Nashik Red Onion');
    assert.equal(res.category, 'VEGETABLES');
    assert.equal(res.quantity_quintals, 5);
    assert.equal(res.quantity_kg, 500);
    assert.equal(res.expected_price_per_kg, 25);
    assert.ok(res.confirmation_prompt.includes('5 क्विंटल'));
  });


  test('Unit: extractAgriSlots parses Telugu phrase and maps to Tomato and Kg price', () => {
    const res = VoiceService.extractAgriSlots('10 క్వింటాళ్ల టమోటాలు కేజీ 30 రూపాయలు', 'te');
    assert.equal(res.crop_name, 'Nashik Hybrid Tomato');
    assert.equal(res.quantity_quintals, 10);
    assert.equal(res.quantity_kg, 1000);
    assert.equal(res.expected_price_per_kg, 30);
  });

  test('Unit: extractAgriSlots converts regional units like Gujarati Mann and Bori', () => {
    // Gujarati 5 Mann = 100 kg (20kg per mann)
    const gujRes = VoiceService.extractAgriSlots('૫ મણ કપાસ ૬૫ રૂપિયા કિલો', 'gu');
    assert.equal(gujRes.crop_name, 'BT Hybrid Cotton');
    assert.equal(gujRes.quantity_kg, 100);
    assert.equal(gujRes.quantity_quintals, 1);
    assert.equal(gujRes.expected_price_per_kg, 65);

    // North Indian 20 Bori = 1000 kg (50kg per bori)
    const boriRes = VoiceService.extractAgriSlots('20 बोरी आलू 20 रुपये किलो', 'hi');
    assert.equal(boriRes.crop_name, 'Jyoti Table Potato');
    assert.equal(boriRes.quantity_kg, 1000);
    assert.equal(boriRes.quantity_quintals, 10);
    assert.equal(boriRes.expected_price_per_kg, 20);
  });

  test('Integration: GET /api/v1/voice/languages returns all 22 official Eighth Schedule languages + English', async () => {
    const res = await fetch(`${baseUrl}/api/v1/voice/languages`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    assert.ok(body.data);
    const keys = Object.keys(body.data);
    assert.equal(keys.length, 23, 'Must include 22 official languages + English');
    assert.ok(body.data.hi);
    assert.ok(body.data.mr);
    assert.ok(body.data.te);
    assert.ok(body.data.ta);
    assert.ok(body.data.bn);
    assert.ok(body.data.pa);
  });

  test('Integration: POST /api/v1/voice/process-intent extracts slots and returns audio feedback', async () => {
    const res = await fetch(`${baseUrl}/api/v1/voice/process-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textTranscript: '१० क्विंटल गावरान टोमॅटो, ३५ रुपये किलो',
        language: 'mr',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.ok(body.data);
    assert.equal(body.data.language, 'mr');
    assert.ok(body.data.extracted);
    assert.equal(body.data.extracted.crop_name, 'Nashik Hybrid Tomato');
    assert.equal(body.data.extracted.quantity_quintals, 10);
    assert.equal(body.data.extracted.expected_price_per_kg, 35);
    assert.ok(body.data.audioFeedbackBase64, 'Should provide synthesized base64 audio feedback');
  });

  test('Integration: POST /api/v1/voice/synthesize generates speech audio payload', async () => {
    const res = await fetch(`${baseUrl}/api/v1/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '१० क्विंटल टोमॅटो नोंदवले आहेत.',
        language: 'mr',
        gender: 'female',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.ok(body.data);
    assert.ok(body.data.audioBase64);
    assert.ok(body.data.mimeType === 'audio/mpeg' || body.data.mimeType === 'audio/wav');
    assert.ok(body.data.durationEstimateMs > 0);
  });

  test('Integration: POST /api/v1/voice/assistant/chat processes Hindi mandi rate query with audio', async () => {
    const res = await fetch(`${baseUrl}/api/v1/voice/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'टमाटर का मंडी भाव क्या है?',
        language: 'hi',
        synthesizeSpeech: true,
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.ok(body.data);
    assert.equal(body.data.intent, 'MANDI_RATES');
    assert.equal(body.data.language, 'hi');
    assert.ok(body.data.reply.includes('नासिक मंडी'));
    assert.ok(body.data.reply.includes('₹35.00'));
    assert.ok(Array.isArray(body.data.suggestedPrompts));
    assert.ok(body.data.suggestedPrompts.length > 0);
    assert.ok(body.data.audioBase64, 'Must synthesize speech feedback');
  });

  test('Integration: POST /api/v1/voice/assistant/chat processes Marathi escrow inquiry', async () => {
    const res = await fetch(`${baseUrl}/api/v1/voice/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'माझे पैसे एस्क्रोमध्ये सुरक्षित आहेत का?',
        language: 'mr',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.ok(body.data);
    assert.equal(body.data.intent, 'ESCROW_PAYMENT');
    assert.equal(body.data.language, 'mr');
    assert.ok(body.data.reply.includes('एस्क्रो'));
  });

  test('Integration: POST /api/v1/voice/assistant/chat validates required message', async () => {
    const res = await fetch(`${baseUrl}/api/v1/voice/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'te',
      }),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as any;
    assert.equal(body.error?.code, 'INVALID_MESSAGE');
  });
});
