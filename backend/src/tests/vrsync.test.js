/**
 * Testes Automatizados da Integração VRSync (Grupo OLX — ZAP Imóveis e Viva Real)
 * Executar com: node src/tests/vrsync.test.js
 */

const assert = require('assert');
const { 
  mapPropertyType, 
  mapTransactionType, 
  mapFeature,
  escapeXml,
  cdata 
} = require('../services/vrsync.mapper');
const { validatePropertyForVRSync } = require('../services/vrsync.validator');
const { generateVRSyncXml, syncPropertiesValidation } = require('../services/vrsync.service');

async function runTests() {
  console.log('🧪 Iniciando bateria de testes do VRSync (Grupo OLX)...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Erro: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Erro: ${err.message}`);
      failed++;
    }
  }

  // ==========================================
  // 1. TESTES DO MAPEADOR (MAPPER)
  // ==========================================
  console.log('📌 1. Testes de Mapeamento de Tipos e Transações:');

  test('Mapeamento de categorias residenciais e comerciais', () => {
    assert.strictEqual(mapPropertyType('apartamento'), 'Residential / Apartment');
    assert.strictEqual(mapPropertyType('casa'), 'Residential / Home');
    assert.strictEqual(mapPropertyType('cobertura'), 'Residential / Penthouse');
    assert.strictEqual(mapPropertyType('terreno'), 'Land / Residential Land');
    assert.strictEqual(mapPropertyType('comercial'), 'Commercial / Office');
    assert.strictEqual(mapPropertyType('kitnet'), 'Residential / Kitnet');
  });

  test('Mapeamento de tipo de transação (Venda e Aluguel)', () => {
    assert.strictEqual(mapTransactionType('venda'), 'For Sale');
    assert.strictEqual(mapTransactionType('aluguel'), 'For Rent');
  });

  test('Mapeamento de características e comodidades', () => {
    assert.strictEqual(mapFeature('piscina'), 'Pool');
    assert.strictEqual(mapFeature('churrasqueira'), 'Barbecue Grill');
    assert.strictEqual(mapFeature('ar condicionado'), 'Air Conditioning');
    assert.strictEqual(mapFeature('academia'), 'Gym');
  });

  test('Sanitização XML e CDATA seguro', () => {
    assert.strictEqual(escapeXml('Casa <Linda> & "Barata"'), 'Casa &lt;Linda&gt; &amp; &quot;Barata&quot;');
    assert.strictEqual(cdata('Texto com <b>HTML</b>'), '<![CDATA[Texto com <b>HTML</b>]]>');
    assert.strictEqual(cdata('Texto com ]]> fechamento'), '<![CDATA[Texto com ]]]]><![CDATA[> fechamento]]>');
  });

  // ==========================================
  // 2. TESTES DE VALIDAÇÃO (VALIDATOR)
  // ==========================================
  console.log('\n📌 2. Testes de Validação de Elegibilidade:');

  test('Imóvel completo e válido deve ser aprovado', () => {
    const validProperty = {
      status: 'ativo',
      titulo: 'Apartamento de Luxo com Vista Guaíba',
      descricao: 'Amplo apartamento com acabamento refinado e vista deslumbrante.',
      preco: '950000',
      tipo: 'venda',
      categoria: 'apartamento',
      cidade: 'Porto Alegre',
      bairro: 'Petrópolis',
      area: 120,
      images: [{ image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', media_type: 'image' }],
    };

    const result = validatePropertyForVRSync(validProperty);
    assert.strictEqual(result.eligible, true);
    assert.strictEqual(result.errors.length, 0);
  });

  test('Imóvel inativo deve ser rejeitado', () => {
    const inactiveProperty = {
      status: 'pendente',
      titulo: 'Casa para Venda',
      descricao: 'Descrição detalhada do imóvel.',
      preco: '500000',
      tipo: 'venda',
      categoria: 'casa',
      cidade: 'Porto Alegre',
      bairro: 'Centro',
      images: [{ image_url: 'https://sample.jpg', media_type: 'image' }],
    };

    const result = validatePropertyForVRSync(inactiveProperty);
    assert.strictEqual(result.eligible, false);
    assert.ok(result.errors.some((e) => e.includes('não está ativo')));
  });

  test('Imóvel sem fotografias públicas deve ser rejeitado', () => {
    const noImagesProperty = {
      status: 'ativo',
      titulo: 'Cobertura Exclusiva',
      descricao: 'Cobertura impecável.',
      preco: '1200000',
      tipo: 'venda',
      categoria: 'cobertura',
      cidade: 'Porto Alegre',
      bairro: 'Moinhos de Vento',
      images: [],
    };

    const result = validatePropertyForVRSync(noImagesProperty);
    assert.strictEqual(result.eligible, false);
    assert.ok(result.errors.some((e) => e.includes('fotografia')));
  });

  test('Imóvel com preço zerado ou negativo deve ser rejeitado', () => {
    const invalidPriceProperty = {
      status: 'ativo',
      titulo: 'Apartamento 2 quartos',
      descricao: 'Descrição longa do apartamento.',
      preco: '0',
      tipo: 'venda',
      categoria: 'apartamento',
      cidade: 'Porto Alegre',
      bairro: 'Petrópolis',
      images: [{ image_url: 'https://sample.jpg' }],
    };

    const result = validatePropertyForVRSync(invalidPriceProperty);
    assert.strictEqual(result.eligible, false);
    assert.ok(result.errors.some((e) => e.includes('Preço é obrigatório')));
  });

  // ==========================================
  // 3. TESTE DE INTEGRAÇÃO COM BANCO E GERAÇÃO DE XML
  // ==========================================
  console.log('\n📌 3. Teste de Geração do Feed XML com Banco de Dados:');

  await asyncTest('Sincronização de validação de imóveis na base', async () => {
    const stats = await syncPropertiesValidation();
    assert.ok(typeof stats.total === 'number');
    assert.ok(typeof stats.inFeed === 'number');
    assert.ok(typeof stats.errors === 'number');
    console.log(`     (Total: ${stats.total}, No Feed: ${stats.inFeed}, Com Erros: ${stats.errors}, Desativados: ${stats.disabled})`);
  });

  await asyncTest('Geração de XML estruturado e em conformidade com VRSync', async () => {
    const xml = await generateVRSyncXml();
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"'));
    assert.ok(xml.includes('<Header>'));
    assert.ok(xml.includes('<Provider>Elena Imóveis</Provider>'));
    assert.ok(xml.includes('</Header>'));
    assert.ok(xml.includes('<Listings>'));
    assert.ok(xml.includes('</Listings>'));
    assert.ok(xml.endsWith('</ListingDataFeed>'));

    // Verificar nós de um imóvel no XML
    if (xml.includes('<Listing>')) {
      assert.ok(xml.includes('<ListingID>'));
      assert.ok(xml.includes('<Title>'));
      assert.ok(xml.includes('<TransactionType>'));
      assert.ok(xml.includes('<Media>'));
      assert.ok(xml.includes('<Details>'));
      assert.ok(xml.includes('<Location'));
      assert.ok(xml.includes('<ContactInfo>'));
    }
  });

  console.log(`\n==========================================`);
  console.log(`🏁 Resumo dos Testes: ${passed} passaram, ${failed} falharam.`);
  console.log(`==========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Erro fatal nos testes:', err);
  process.exit(1);
});
