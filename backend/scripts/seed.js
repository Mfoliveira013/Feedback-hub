import { pool } from "../src/db/pool.js";

async function upsertUser(user) {
  await pool.query(
    `INSERT INTO users (email, full_name, cargo, setor, tema, foto_perfil, gerente_responsavel_email, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       cargo = VALUES(cargo),
       setor = VALUES(setor),
       tema = VALUES(tema),
       foto_perfil = VALUES(foto_perfil),
       gerente_responsavel_email = VALUES(gerente_responsavel_email)`,
    [
      user.email,
      user.full_name,
      user.cargo,
      user.setor,
      user.tema,
      user.foto_perfil || null,
      user.gerente_responsavel || null,
    ]
  );
}

async function run() {
  const seedUsers = [
    {
      email: "mfo.oliveira0013@gmail.com",
      full_name: "Mauricio Oliveira",
      cargo: "administrador",
      setor: "Tecnologia",
      tema: "claro",
      foto_perfil: "",
    },
    {
      email: "gestor@nefadv.com.br",
      full_name: "Gestor Exemplo",
      cargo: "gestor",
      setor: "Controladoria",
      tema: "claro",
      foto_perfil: "",
    },
    {
      email: "ana@nefadv.com.br",
      full_name: "Ana Souza",
      cargo: "usuario",
      setor: "Controladoria",
      tema: "claro",
      foto_perfil: "",
      gerente_responsavel: "gestor@nefadv.com.br",
    },
    {
      email: "bruno@nefadv.com.br",
      full_name: "Bruno Lima",
      cargo: "usuario",
      setor: "Tecnologia",
      tema: "escuro",
      foto_perfil: "",
    },
  ];

  for (let index = 0; index < seedUsers.length; index += 1) {
    await upsertUser(seedUsers[index]);
  }

  const [usersRows] = await pool.query("SELECT id, email FROM users");
  const userByEmail = new Map(usersRows.map((item) => [item.email, item.id]));

  const managerLinks = [
    { user: "ana@nefadv.com.br", manager: "gestor@nefadv.com.br" },
  ];

  for (let index = 0; index < managerLinks.length; index += 1) {
    const item = managerLinks[index];
    const userId = userByEmail.get(item.user);
    const managerId = userByEmail.get(item.manager);
    if (!userId || !managerId || userId === managerId) continue;
    await pool.query(
      `INSERT IGNORE INTO user_gestores (user_id, gestor_user_id) VALUES (?, ?)`,
      [userId, managerId]
    );
  }

  const [feedbackCountRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM feedbacks"
  );
  const feedbackCount = Number(feedbackCountRows[0]?.total || 0);

  if (feedbackCount === 0) {
    const now = Date.now();
    const rows = [
      {
        created: new Date(now - 1000 * 60 * 60 * 24 * 5),
        remetente_email: "gestor@nefadv.com.br",
        remetente_nome: "Gestor Exemplo",
        destinatario_email: "ana@nefadv.com.br",
        destinatario_nome: "Ana Souza",
        titulo: JSON.stringify(["Desenvolvimento"]),
        descricao: "Bom avanço no processo da equipe.",
        nota: 4.2,
        classificacao: "Supera parcialmente",
        tipo_avaliacao: "feedback",
        status_email: "enviado",
        registrado_por_cargo: "gestor",
      },
      {
        created: new Date(now - 1000 * 60 * 60 * 24 * 2),
        remetente_email: "mfo.oliveira0013@gmail.com",
        remetente_nome: "Mauricio Oliveira",
        destinatario_email: "bruno@nefadv.com.br",
        destinatario_nome: "Bruno Lima",
        titulo: JSON.stringify(["Produtividade"]),
        descricao: "Entrega consistente e dentro do prazo.",
        nota: 4.7,
        classificacao: "Supera parcialmente",
        tipo_avaliacao: "avaliacao_pontual",
        status_email: "enviado",
        registrado_por_cargo: "administrador",
      },
    ];

    for (let index = 0; index < rows.length; index += 1) {
      const item = rows[index];
      await pool.query(
        `INSERT INTO feedbacks (
          created_date, data_ocorrido,
          remetente_user_id, remetente_email, remetente_nome,
          destinatario_user_id, destinatario_email, destinatario_nome,
          titulo_json, descricao, nota, classificacao, tipo_avaliacao, retroativo, status_email, registrado_por_cargo, status_avaliacao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'Enviada')`,
        [
          item.created,
          item.created,
          userByEmail.get(item.remetente_email) || null,
          item.remetente_email,
          item.remetente_nome,
          userByEmail.get(item.destinatario_email) || null,
          item.destinatario_email,
          item.destinatario_nome,
          item.titulo,
          item.descricao,
          item.nota,
          item.classificacao,
          item.tipo_avaliacao,
          item.status_email,
          item.registrado_por_cargo,
        ]
      );
    }
  }

  // eslint-disable-next-line no-console
  console.log("Seed concluido com sucesso.");
}

run()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

