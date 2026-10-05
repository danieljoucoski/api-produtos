const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

// Permite receber JSON no body
app.use(express.json());

// CORS - Permite que qualquer origem acesse a API
app.use(cors());

/*
========================

http://localhost:3000/saudacao?nome=Joao
*/
app.get("/saudacao", (req, res) => {
    const nome = req.query.nome;

    if (!nome) {
        return res.status(400).json({ erro: "Nome não enviado" });
    }

    res.json({ mensagem: `Seu nome é ${nome}` });
});


/*
========================
POST - Calcula IMC
========================

POST http://localhost:3000/imc

Body JSON esperado:
{
  "nome": "Joao",
  "idade": 25,
  "altura": 1.75,
  "peso": 70
}
*/
app.post("/imc", (req, res) => {
    const { nome, idade, altura, peso } = req.body;

    if (!nome || !idade || !altura || !peso) {
        return res.status(400).json({ erro: "Dados incompletos" });
    }

    const imc = peso / (altura * altura);

    res.json({
        nome,
        idade,
        imc: imc.toFixed(2)
    });
});

/*
========================
CLIENTES ENDPOINTS
========================
*/
const produtosFile = path.join(__dirname, "produtos.json");

function lerProdutos() {
    if (!fs.existsSync(produtosFile)) {
        return [];
    }
    const data = fs.readFileSync(produtosFile, "utf-8");
    try {
        return JSON.parse(data) || [];
    } catch (e) {
        return [];
    }
}

function salvarProdutos(produtos) {
    fs.writeFileSync(produtosFile, JSON.stringify(produtos, null, 2), "utf-8");
}

// GET http://localhost:3000/clientes
app.get("/produtos", (req, res) => {
    const produtos = lerProdutos();
    res.json(produtos);
});

// POST http://localhost:3000/clientes
app.post("/produtos", (req, res) => {
    const { caracteristica, nome, preco, quantidade } = req.body;

    if (!caracteristica || !nome) {
        return res.status(400).json({ erro: "A caracteristica e o Nome são obrigatórios." });
    }

    const produtos = lerProdutos();


    const novoProduto = { caracteristica, nome, preco, quantidade };
    produtos.push(novoProduto);
    salvarProdutos(produtos);

    res.status(201).json({ mensagem: "Produto adicionado com sucesso", produto: novoProduto });
});

// get http://localhost:3000/produtos/:caracteristica
app.get("/produtos/:caracteristica", (req, res) => {
    const { caracteristica } = req.params;
    const { nome, preco, quantidade } = req.body;

    const produtos = lerProdutos();
    const index = produtos.findIndex(c => c.caracteristica === caracteristica);

    if (index === -1) {
        return res.status(404).json({ erro: "caracteristica não encontrado." });
    }

    produtos[index] = {
        ...produtos[index],
        caracteristica, // Mantém o CPF inalterado
        ...(nome !== undefined && { nome }),
        ...(preco !== undefined && { preco }),
        ...(quantidade !== undefined && { quantidade })
    };

    //salvarProdutos(produtos);

    res.json({ mensagem: "produto atualizado com sucesso", produto: produtos[index] });
});

/*
========================
USUÁRIOS / LOGIN ENDPOINTS
========================
*/
const usuariosFile = path.join(__dirname, "usuarios.json");

function lerUsuarios() {
    if (!fs.existsSync(usuariosFile)) {
        return [];
    }
    const data = fs.readFileSync(usuariosFile, "utf-8");
    try {
        return JSON.parse(data) || [];
    } catch (e) {
        return [];
    }
}

function salvarUsuarios(usuarios) {
    fs.writeFileSync(usuariosFile, JSON.stringify(usuarios, null, 2), "utf-8");
}

// POST http://localhost:3000/usuarios
app.post("/usuarios", (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
    }

    const usuarios = lerUsuarios();

    if (usuarios.some(u => u.email === email)) {
        return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
    }

    const novoUsuario = { nome, email, senha };
    usuarios.push(novoUsuario);
    salvarUsuarios(usuarios);

    // Gera um token para o usuário recém-cadastrado
    const token = crypto.randomUUID();
    res.status(201).json({ token, mensagem: "Usuário cadastrado com sucesso!" });
});

// POST http://localhost:3000/login
app.post("/login", (req, res) => {
    const { user, senha } = req.body; // 'user' é o e-mail no front-end

    if (!user || !senha) {
        return res.status(400).json({ erro: "E-mail (user) e senha são obrigatórios." });
    }

    const usuarios = lerUsuarios();
    const usuario = usuarios.find(u => u.email === user);

    if (!usuario || usuario.senha !== senha) {
        return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }

    // Gera um token para a sessão
    const token = crypto.randomUUID();
    res.json({ token, mensagem: "Login realizado com sucesso!" });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});