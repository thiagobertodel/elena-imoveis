const bcrypt = require('bcrypt');
const { pool } = require('../connection');

const SALT_ROUNDS = 12;

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Iniciando seed...');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordValue = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPasswordValue) {
      throw new Error('ADMIN_EMAIL e ADMIN_PASSWORD precisam estar definidos no .env');
    }

    // Limpar tabelas
    await client.query('DELETE FROM property_images');
    await client.query('DELETE FROM properties');
    await client.query('DELETE FROM users');

    // Criar usuários
    const adminPassword = await bcrypt.hash(adminPasswordValue, SALT_ROUNDS);
    const admin = await client.query(`
      INSERT INTO users (nome, email, senha, telefone, role, lgpd_consent, lgpd_consent_date)
      VALUES ('Admin Elena', $2, $1, '(51) 99999-0001', 'admin', true, NOW())
      RETURNING id
    `, [adminPassword, adminEmail]);

    const adminId = admin.rows[0].id;

    console.log('✅ Usuários criados');

    // Criar imóveis
    const properties = [
      {
        titulo: 'Apartamento 3 Quartos no Moinhos de Vento',
        descricao: 'Lindo apartamento reformado com 3 dormitórios, sendo 1 suíte, no coração do Moinhos de Vento. Vista panorâmica, 2 vagas de garagem. Portaria 24h, academia e salão de festas.',
        preco: 890000, tipo: 'venda', categoria: 'apartamento',
        area: 120, quartos: 3, banheiros: 2, garagem: 2,
        cidade: 'Porto Alegre', bairro: 'Moinhos de Vento',
        endereco: 'Rua Padre Chagas, 300', cep: '90570-080',
        latitude: -30.0277, longitude: -51.1963, status: 'ativo', destaque: true,
      },
      {
        titulo: 'Casa 4 Quartos com Piscina em Tristeza',
        descricao: 'Espetacular casa de 4 dormitórios com suíte master, piscina aquecida, churrasqueira coberta e amplo jardim. Rua tranquila e arborizada.',
        preco: 1250000, tipo: 'venda', categoria: 'casa',
        area: 280, quartos: 4, banheiros: 3, garagem: 3,
        cidade: 'Porto Alegre', bairro: 'Tristeza',
        endereco: 'Rua Piauí, 450', cep: '91920-040',
        latitude: -30.1150, longitude: -51.2350, status: 'ativo', destaque: true,
      },
      {
        titulo: 'Cobertura Duplex no Bela Vista',
        descricao: 'Cobertura duplex com terraço panorâmico, 3 suítes, sala ampla com lareira, cozinha americana gourmet. Condomínio com infraestrutura completa.',
        preco: 1800000, tipo: 'venda', categoria: 'cobertura',
        area: 220, quartos: 3, banheiros: 4, garagem: 3,
        cidade: 'Porto Alegre', bairro: 'Bela Vista',
        endereco: 'Av. Nilópolis, 1200', cep: '90460-050',
        latitude: -30.0330, longitude: -51.2080, status: 'ativo', destaque: true,
      },
      {
        titulo: 'Kitnet Mobiliada no Centro Histórico',
        descricao: 'Kitnet recém reformada, totalmente mobiliada, ideal para estudantes e profissionais. Próximo ao Mercado Público e transporte público.',
        preco: 1200, tipo: 'aluguel', categoria: 'kitnet',
        area: 35, quartos: 1, banheiros: 1, garagem: 0,
        cidade: 'Porto Alegre', bairro: 'Centro Histórico',
        endereco: 'Rua dos Andradas, 800', cep: '90020-006',
        latitude: -30.0346, longitude: -51.2300, status: 'ativo', destaque: false,
      },
      {
        titulo: 'Apartamento 2 Quartos em Canoas',
        descricao: 'Apartamento novo, pronto para morar. 2 dormitórios, living amplo, sacada com churrasqueira. Condomínio com lazer completo.',
        preco: 320000, tipo: 'venda', categoria: 'apartamento',
        area: 68, quartos: 2, banheiros: 1, garagem: 1,
        cidade: 'Canoas', bairro: 'Centro',
        endereco: 'Rua Victor Barreto, 200', cep: '92010-000',
        latitude: -29.9185, longitude: -51.1812, status: 'ativo', destaque: false,
      },
      {
        titulo: 'Terreno 600m² em Cachoeirinha',
        descricao: 'Excelente terreno plano de 600m², escriturado, em rua asfaltada. Ideal para construção residencial ou comercial.',
        preco: 180000, tipo: 'venda', categoria: 'terreno',
        area: 600, quartos: 0, banheiros: 0, garagem: 0,
        cidade: 'Cachoeirinha', bairro: 'Vila Veranópolis',
        endereco: 'Rua Marechal Floriano, 500', cep: '94910-000',
        latitude: -29.9500, longitude: -51.1000, status: 'ativo', destaque: false,
      },
      {
        titulo: 'Sala Comercial no Bom Fim',
        descricao: 'Sala comercial de 45m² com banheiro privativo, em prédio com portaria e elevador. Excelente localização comercial.',
        preco: 2500, tipo: 'aluguel', categoria: 'comercial',
        area: 45, quartos: 0, banheiros: 1, garagem: 0,
        cidade: 'Porto Alegre', bairro: 'Bom Fim',
        endereco: 'Av. Osvaldo Aranha, 350', cep: '90035-190',
        latitude: -30.0350, longitude: -51.2160, status: 'ativo', destaque: true,
      },
      {
        titulo: 'Apartamento de Luxo na Beira do Guaíba',
        descricao: 'Apartamento alto padrão com vista permanente para o Rio Guaíba. 4 suítes, living de 60m², 4 vagas. O melhor do mercado imobiliário de Porto Alegre.',
        preco: 3500000, tipo: 'venda', categoria: 'apartamento',
        area: 350, quartos: 4, banheiros: 5, garagem: 4,
        cidade: 'Porto Alegre', bairro: 'Praia de Belas',
        endereco: 'Av. Beira Rio, 100', cep: '90110-150',
        latitude: -30.0450, longitude: -51.2350, status: 'ativo', destaque: true,
      },
      {
        titulo: 'Casa 2 Quartos para Alugar em Viamão',
        descricao: 'Casa simples e aconchegante com 2 quartos, sala, cozinha e pátio. Água e luz incluso no valor do aluguel.',
        preco: 950, tipo: 'aluguel', categoria: 'casa',
        area: 70, quartos: 2, banheiros: 1, garagem: 1,
        cidade: 'Viamão', bairro: 'Centro',
        endereco: 'Rua Bento Gonçalves, 200', cep: '94410-000',
        latitude: -30.0810, longitude: -51.0230, status: 'ativo', destaque: false,
      },
      {
        titulo: 'Apartamento Pendente - Petrópolis',
        descricao: 'Apartamento 2 quartos em Petrópolis aguardando aprovação do administrador.',
        preco: 450000, tipo: 'venda', categoria: 'apartamento',
        area: 75, quartos: 2, banheiros: 1, garagem: 1,
        cidade: 'Porto Alegre', bairro: 'Petrópolis',
        endereco: 'Rua Felipe Camarão, 100', cep: '90040-040',
        latitude: -30.0280, longitude: -51.1990, status: 'pendente', destaque: false,
      },
    ];

    const placeholderImages = [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
    ];

    for (let i = 0; i < properties.length; i++) {
      const p = properties[i];
      const result = await client.query(`
        INSERT INTO properties (
          user_id, titulo, descricao, preco, tipo, categoria,
          area, quartos, banheiros, garagem,
          cidade, bairro, endereco, cep,
          latitude, longitude, status, destaque,
          visualizacoes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        RETURNING id
      `, [
        adminId, p.titulo, p.descricao, p.preco, p.tipo, p.categoria,
        p.area, p.quartos, p.banheiros, p.garagem,
        p.cidade, p.bairro, p.endereco, p.cep,
        p.latitude, p.longitude, p.status, p.destaque,
        Math.floor(Math.random() * 500),
      ]);

      // Adicionar imagens (cover + 2 extras)
      const propertyId = result.rows[0].id;
      await client.query(
        'INSERT INTO property_images (property_id, image_url, is_cover) VALUES ($1, $2, true)',
        [propertyId, placeholderImages[i % placeholderImages.length]]
      );

      // Adicionar 2 imagens extras
      for (let j = 1; j <= 2; j++) {
        await client.query(
          'INSERT INTO property_images (property_id, image_url, is_cover) VALUES ($1, $2, false)',
          [propertyId, placeholderImages[(i + j) % placeholderImages.length]]
        );
      }
    }

    console.log(`✅ ${properties.length} imóveis criados com imagens`);

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log(`\n📧 Administrador: ${adminEmail}`);

  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
