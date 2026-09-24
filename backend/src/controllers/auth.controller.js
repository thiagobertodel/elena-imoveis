const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

const SALT_ROUNDS = 12;

/**
 * Gera um token JWT.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

/**
 * POST /api/v1/auth/login
 * Login com email e senha.
 */
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    // Buscar usuário
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const user = result.rows[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      token,
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * GET /api/v1/auth/me
 * Retorna dados do usuário autenticado.
 */
async function getMe(req, res) {
  try {
    const result = await query(
      'SELECT id, nome, email, telefone, avatar_url, role, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * PUT /api/v1/auth/change-password
 * Alteração de senha do usuário autenticado.
 */
async function changePassword(req, res) {
  try {
    const { senha_atual, nova_senha } = req.body;

    const result = await query('SELECT senha FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const validPassword = await bcrypt.compare(senha_atual, result.rows[0].senha);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    const hashedPassword = await bcrypt.hash(nova_senha, SALT_ROUNDS);
    await query('UPDATE users SET senha = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, req.userId]);

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * PUT /api/v1/auth/profile
 * Atualiza perfil do usuário.
 */
async function updateProfile(req, res) {
  try {
    const { nome, telefone } = req.body;

    const result = await query(
      `UPDATE users SET nome = COALESCE($1, nome), telefone = COALESCE($2, telefone), updated_at = NOW()
       WHERE id = $3
       RETURNING id, nome, email, telefone, avatar_url, role`,
      [nome, telefone, req.userId]
    );

    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * DELETE /api/v1/auth/account
 * Exclui conta e todos os dados (LGPD — direito ao esquecimento).
 */
async function deleteAccount(req, res) {
  try {
    await query('DELETE FROM users WHERE id = $1', [req.userId]);
    return res.json({ message: 'Conta e todos os dados foram excluídos permanentemente' });
  } catch (err) {
    console.error('Erro ao excluir conta:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * GET /api/v1/auth/my-data
 * Exporta todos os dados do usuário (LGPD — direito de acesso).
 */
async function exportMyData(req, res) {
  try {
    const user = await query(
      'SELECT id, nome, email, telefone, role, lgpd_consent, lgpd_consent_date, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    const properties = await query('SELECT * FROM properties WHERE user_id = $1', [req.userId]);

    return res.json({
      dados_pessoais: user.rows[0],
      imoveis: properties.rows,
      exportado_em: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Erro ao exportar dados:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = {
  login,
  getMe,
  changePassword,
  updateProfile,
  deleteAccount,
  exportMyData,
};
