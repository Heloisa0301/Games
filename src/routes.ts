import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { openDb } from './database';

const routes = Router();

routes.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (email === "usuario@esoft.com" && password === "Abc123") {
      res.status(200).json({ token: randomUUID() });
      return;
    }
    
    res.status(401).json({ error: "Credenciais inválidas" });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

routes.get('/jogos', async (req: Request, res: Response) => {
  try {
    const db = await openDb();

    const { tipo, favorito, notaMinima, busca } = req.query;

    let sql = 'SELECT * FROM jogos WHERE 1 = 1';
    const params: any[] = [];

    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }

    if (favorito !== undefined) {
      sql += ' AND favorito = ?';
      params.push(favorito === 'true' ? 1 : 0);
    }

    if (notaMinima !== undefined) {
      sql += ' AND nota >= ?';
      params.push(Number(notaMinima));
    }

    if (busca) {
      sql += ' AND nome LIKE ?';
      params.push(`%${busca}%`);
    }

    sql += ' ORDER BY nota DESC';

    const jogos = await db.all(sql, params);

    res.status(200).json({
      total: jogos.length,
      filtros: {
        tipo: tipo || null,
        favorito: favorito || null,
        notaMinima: notaMinima || null,
        busca: busca || null
      },
      jogos
    });
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

routes.get('/jogos/estatisticas/resumo', async (_req: Request, res: Response) => {
  try {
    const db = await openDb();

    const total = await db.get(
      'SELECT COUNT(*) as total FROM jogos'
    );

    const media = await db.get(
      'SELECT ROUND(AVG(nota), 2) as media FROM jogos'
    );

    const melhor = await db.get(
      `SELECT * FROM jogos
       ORDER BY nota DESC
       LIMIT 1`
    );

    const pior = await db.get(
      `SELECT * FROM jogos
       ORDER BY nota ASC
       LIMIT 1`
    );

    const favoritos = await db.get(
      `SELECT COUNT(*) as total
       FROM jogos
       WHERE favorito = 1`
    );

    res.status(200).json({
      totalJogos: total.total,
      notaMedia: media.media || 0,
      totalFavoritos: favoritos.total,
      melhorJogo: melhor || null,
      piorJogo: pior || null
    });
  } catch (error) {
    console.error('Erro ao gerar estatísticas:', error);

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});


routes.get('/jogos/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido fornecido na URL" });
      return;
    }

    const db = await openDb();
    const jogo = await db.get('SELECT * FROM jogos WHERE id = ?', [id]);
    
    if (!jogo) {
      res.status(404).json({ error: "Jogo não encontrado" });
      return;
    }
    
    res.status(200).json(jogo);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

routes.post('/jogos', async (req: Request, res: Response) => {
  try {
    const { nome, tipo, nota, review } = req.body;
    
    if (!nome || !tipo || nota === undefined || !review) {
      res.status(400).json({ error: "Todos os campos (nome, tipo, nota, review) são obrigatórios" });
      return;
    }

    const db = await openDb();
    const result = await db.run(
      'INSERT INTO jogos (nome, tipo, nota, review) VALUES (?, ?, ?, ?)',
      [nome, tipo, nota, review]
    );
    
    const novoJogo = await db.get('SELECT * FROM jogos WHERE id = ?', [result.lastID]);
    res.status(201).json(novoJogo);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

routes.put('/jogos/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido fornecido na URL" });
      return;
    }

    const { nome, tipo, nota, review } = req.body;
    
    if (!nome || !tipo || nota === undefined || !review) {
      res.status(400).json({ error: "Todos os campos (nome, tipo, nota, review) são obrigatórios" });
      return;
    }

    const db = await openDb();
    const jogoExistente = await db.get('SELECT * FROM jogos WHERE id = ?', [id]);
    
    if (!jogoExistente) {
      res.status(404).json({ error: "Jogo não encontrado" });
      return;
    }

    await db.run(
      'UPDATE jogos SET nome = ?, tipo = ?, nota = ?, review = ? WHERE id = ?',
      [nome, tipo, nota, review, id]
    );
    
    const jogoAtualizado = await db.get('SELECT * FROM jogos WHERE id = ?', [id]);
    res.status(200).json(jogoAtualizado);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

routes.delete('/jogos/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    if (isNaN(id)) {
      res.status(400).json({ error: "ID inválido fornecido na URL" });
      return;
    }

    const db = await openDb();
    const jogoExistente = await db.get('SELECT * FROM jogos WHERE id = ?', [id]);
    
    if (!jogoExistente) {
      res.status(404).json({ error: "Jogo não encontrado" });
      return;
    }

    await db.run('DELETE FROM jogos WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export { routes };