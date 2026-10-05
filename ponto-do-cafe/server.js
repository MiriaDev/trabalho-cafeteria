const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const app = express();
const PORTA = 3000;

// Cria a pasta do banco caso ela não exista
const pastaBanco = path.join(__dirname, "banco");

if (!fs.existsSync(pastaBanco)) {
    fs.mkdirSync(pastaBanco);
}

// Conecta ao banco SQLite
const db = new Database(path.join(pastaBanco, "clientes.db"));

// Cria a tabela caso ainda não exista
db.prepare(`
    CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL CHECK (trim(nome) <> ''),
        telefone TEXT NOT NULL CHECK (trim(telefone) <> ''),
        email TEXT NOT NULL CHECK (trim(email) <> '')
    )
`).run();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =============================
// CONSULTAR CLIENTES
// =============================
app.get("/api/clientes", (req, res) => {
    try {
        const clientes = db.prepare(`
            SELECT id, nome, telefone, email
            FROM clientes
            ORDER BY id
        `).all();

        res.json(clientes);
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao consultar os clientes."
        });
    }
});

// =============================
// CADASTRAR CLIENTE
// =============================
app.post("/api/clientes", (req, res) => {
    const { nome, telefone, email } = req.body;

    // Verificação dos campos obrigatórios
    if (
        !nome ||
        !nome.trim() ||
        !telefone ||
        !telefone.trim() ||
        !email ||
        !email.trim()
    ) {
        return res.status(400).json({
            erro: "Todos os campos são obrigatórios."
        });
    }

    try {
        const resultado = db.prepare(`
            INSERT INTO clientes (nome, telefone, email)
            VALUES (?, ?, ?)
        `).run(
            nome.trim(),
            telefone.trim(),
            email.trim()
        );

        res.status(201).json({
            mensagem: "Cliente cadastrado com sucesso.",
            id: resultado.lastInsertRowid
        });
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao cadastrar o cliente."
        });
    }
});

// =============================
// EXCLUIR CLIENTE
// =============================
app.delete("/api/clientes/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            erro: "Identificador inválido."
        });
    }

    try {
        const resultado = db.prepare(`
            DELETE FROM clientes
            WHERE id = ?
        `).run(id);

        if (resultado.changes === 0) {
            return res.status(404).json({
                erro: "Cliente não encontrado."
            });
        }

        res.json({
            mensagem: "Cliente excluído com sucesso."
        });
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao excluir o cliente."
        });
    }
});

// Inicia o servidor
app.listen(PORTA, () => {
    console.log(`Sistema funcionando em http://localhost:${PORTA}`);
});