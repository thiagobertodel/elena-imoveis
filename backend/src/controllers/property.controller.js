const { query } = require('../database/connection');

/**
 * GET /api/v1/properties
 * Lista imóveis com filtros, paginação e ordenação.
 */
async function listProperties(req, res) {
  try {
    const {
      cidade, bairro, tipo, categoria,
      preco_min, preco_max, quartos_min, area_min,
      page = 1, limit = 12, order = 'recente',
    } = req.query;

    let sql = `
      SELECT p.*, 
        (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = true LIMIT 1) as cover_url,
        (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) as total_images,
        u.nome as anunciante_nome
      FROM properties p
      JOIN users u ON u.id = p.user_id
      WHERE p.status = 'ativo'
    `;
    const params = [];
    let paramIndex = 1;

    if (cidade) {
      sql += ` AND LOWER(p.cidade) LIKE LOWER($${paramIndex})`;
      params.push(`%${cidade}%`);
      paramIndex++;
    }
    if (bairro) {
      sql += ` AND LOWER(p.bairro) LIKE LOWER($${paramIndex})`;
      params.push(`%${bairro}%`);
      paramIndex++;
    }
    if (tipo) {
      sql += ` AND p.tipo = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }
    if (categoria) {
      sql += ` AND p.categoria = $${paramIndex}`;
      params.push(categoria);
      paramIndex++;
    }
    if (preco_min) {
      sql += ` AND p.preco >= $${paramIndex}`;
      params.push(parseFloat(preco_min));
      paramIndex++;
    }
    if (preco_max) {
      sql += ` AND p.preco <= $${paramIndex}`;
      params.push(parseFloat(preco_max));
      paramIndex++;
    }
    if (quartos_min) {
      sql += ` AND p.quartos >= $${paramIndex}`;
      params.push(parseInt(quartos_min));
      paramIndex++;
    }
    if (area_min) {
      sql += ` AND p.area >= $${paramIndex}`;
      params.push(parseInt(area_min));
      paramIndex++;
    }

    // Ordenação
    switch (order) {
      case 'preco_asc':
        sql += ' ORDER BY p.preco ASC';
        break;
      case 'preco_desc':
        sql += ' ORDER BY p.preco DESC';
        break;
      case 'relevancia':
        sql += ' ORDER BY p.destaque DESC, p.visualizacoes DESC';
        break;
      default:
        sql += ' ORDER BY p.created_at DESC';
    }

    // Contagem total (para paginação)
    const countSql = sql.replace(/SELECT p\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await query(countSql.split('ORDER BY')[0], params);
    const total = parseInt(countResult.rows[0].total);

    // Paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    return res.json({
      properties: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Erro ao listar imóveis:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * GET /api/v1/properties/featured
 * Lista imóveis em destaque.
 */
async function getFeatured(req, res) {
  try {
    const result = await query(`
      SELECT p.*,
        (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = true LIMIT 1) as cover_url,
        u.nome as anunciante_nome
      FROM properties p
      JOIN users u ON u.id = p.user_id
      WHERE p.status = 'ativo' AND p.destaque = true
      ORDER BY p.created_at DESC
      LIMIT 8
    `);

    return res.json({ properties: result.rows });
  } catch (err) {
    console.error('Erro ao buscar destaques:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * GET /api/v1/properties/cities
 * Lista cidades disponíveis.
 */
async function getCities(req, res) {
  try {
    const result = await query(`
      SELECT DISTINCT cidade, COUNT(*) as total
      FROM properties
      WHERE status = 'ativo'
      GROUP BY cidade
      ORDER BY total DESC
    `);

    return res.json({ cities: result.rows });
  } catch (err) {
    console.error('Erro ao buscar cidades:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * GET /api/v1/properties/:id
 * Detalhes de um imóvel + incrementa visualizações.
 */
async function getProperty(req, res) {
  try {
    const { id } = req.params;

    // Incrementar visualizações
    await query('UPDATE properties SET visualizacoes = visualizacoes + 1 WHERE id = $1', [id]);

    // Buscar imóvel
    const result = await query(`
      SELECT p.*, u.nome as anunciante_nome, u.email as anunciante_email, u.telefone as anunciante_telefone
      FROM properties p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }

    // Buscar imagens
    const images = await query(
      'SELECT * FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, created_at ASC',
      [id]
    );

    // Buscar imóveis semelhantes
    const property = result.rows[0];
    const similar = await query(`
      SELECT p.*,
        (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = true LIMIT 1) as cover_url
      FROM properties p
      WHERE p.status = 'ativo'
        AND p.id != $1
        AND p.cidade = $2
        AND p.tipo = $3
      ORDER BY ABS(p.preco - $4) ASC
      LIMIT 4
    `, [id, property.cidade, property.tipo, property.preco]);

    return res.json({
      property: {
        ...property,
        images: images.rows,
      },
      similar: similar.rows,
    });
  } catch (err) {
    console.error('Erro ao buscar imóvel:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * POST /api/v1/properties
 * Cria um novo imóvel.
 */
async function createProperty(req, res) {
  try {
    const {
      titulo, descricao, preco, tipo, categoria,
      area, quartos, banheiros, garagem,
      cidade, bairro, endereco, cep,
      latitude, longitude,
    } = req.body;

    const result = await query(`
      INSERT INTO properties (
        user_id, titulo, descricao, preco, tipo, categoria,
        area, quartos, banheiros, garagem,
        cidade, bairro, endereco, cep,
        latitude, longitude, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'ativo')
      RETURNING *
    `, [
      req.userId, titulo, descricao, preco, tipo, categoria,
      area || null, quartos || 0, banheiros || 0, garagem || 0,
      cidade, bairro || null, endereco || null, cep || null,
      latitude || null, longitude || null,
    ]);

    return res.status(201).json({
      message: 'Imóvel cadastrado com sucesso e publicado.',
      property: result.rows[0],
    });
  } catch (err) {
    console.error('Erro ao criar imóvel:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * PUT /api/v1/properties/:id
 * Atualiza um imóvel (apenas o dono).
 */
async function updateProperty(req, res) {
  try {
    const { id } = req.params;

    // Verificar propriedade
    const existing = await query('SELECT user_id FROM properties WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }
    if (existing.rows[0].user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Você não tem permissão para editar este imóvel' });
    }

    const {
      titulo, descricao, preco, tipo, categoria,
      area, quartos, banheiros, garagem,
      cidade, bairro, endereco, cep,
      latitude, longitude,
    } = req.body;

    const result = await query(`
      UPDATE properties SET
        titulo = COALESCE($1, titulo),
        descricao = COALESCE($2, descricao),
        preco = COALESCE($3, preco),
        tipo = COALESCE($4, tipo),
        categoria = COALESCE($5, categoria),
        area = COALESCE($6, area),
        quartos = COALESCE($7, quartos),
        banheiros = COALESCE($8, banheiros),
        garagem = COALESCE($9, garagem),
        cidade = COALESCE($10, cidade),
        bairro = COALESCE($11, bairro),
        endereco = COALESCE($12, endereco),
        cep = COALESCE($13, cep),
        latitude = COALESCE($14, latitude),
        longitude = COALESCE($15, longitude),
        updated_at = NOW()
      WHERE id = $16
      RETURNING *
    `, [
      titulo, descricao, preco, tipo, categoria,
      area, quartos, banheiros, garagem,
      cidade, bairro, endereco, cep,
      latitude, longitude, id,
    ]);

    return res.json({ property: result.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar imóvel:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * DELETE /api/v1/properties/:id
 * Remove um imóvel (dono ou admin).
 */
async function deleteProperty(req, res) {
  try {
    const { id } = req.params;

    const existing = await query('SELECT user_id FROM properties WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }
    if (existing.rows[0].user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Você não tem permissão para excluir este imóvel' });
    }

    await query('DELETE FROM properties WHERE id = $1', [id]);
    return res.json({ message: 'Imóvel excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir imóvel:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * GET /api/v1/properties/my
 * Lista imóveis do usuário autenticado.
 */
async function getMyProperties(req, res) {
  try {
    const result = await query(`
      SELECT p.*,
        (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = true LIMIT 1) as cover_url,
        (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) as total_images
      FROM properties p
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.userId]);

    return res.json({ properties: result.rows });
  } catch (err) {
    console.error('Erro ao buscar meus imóveis:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = {
  listProperties,
  getFeatured,
  getCities,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
};
