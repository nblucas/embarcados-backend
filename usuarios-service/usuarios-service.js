const express = require('express');
const app = express();

const sqlite3 = require('sqlite3');

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

function validateCpf(cpf) {
    let cpfNumbers = cpf.substring(0, 9);

    let sumNumbers = 0;

    for (let i = 0; i < cpfNumbers.length; i++) {
        sumNumbers += cpfNumbers[i] * (10 - i);
    }

    let remainder = sumNumbers % 11;

    const firstVerificationDigit = remainder < 2 ? 0 : 11 - remainder;

    cpfNumbers += firstVerificationDigit;

    sumNumbers = 0;

    for (let i = 0; i < cpfNumbers.length; i++) {
        sumNumbers += cpfNumbers[i] * (11 - i);
    }

    remainder = sumNumbers % 11;

    const secondVerificationDigit = remainder < 2 ? 0 : 11 - remainder;

    cpfNumbers += secondVerificationDigit;

    return cpf === cpfNumbers;

}

function validateEmail(email) {
    const re = /[a-z]+@[a-z]+\.[a-z]+/;

    return re.test(email);
}

const db = new sqlite3.Database('./usuarios.db', (err) => {
    if (err) {
        console.log('ERRO: não foi possível conectar ao banco "usuarios".');
        throw err;
    }
    console.log('Conectado ao banco "usuarios"!');
});

db.run(`CREATE TABLE IF NOT EXISTS usuarios 
    (
        cpf TEXT PRIMARY KEY NOT NULL UNIQUE,
        nome TEXT NOT NULL, 
        email TEXT NOT NULL,
        cartao TEXT NOT NULL
    )`, 
    [], (err) => {
       if (err) {
          console.log('ERRO: não foi possível criar tabela "usuarios".');
          throw err;
       }
});    

app.post('/usuarios', (req, res, next) => {

    if (!validateCpf(req.body.cpf)) {
        res.status(500).send('Erro ao cadastrar usuário. CPF inválido.');
    } 

    if (!validateEmail(req.body.email)) {
        res.status(500).send('Erro ao cadastrar usuário. Email inválido.');
    }

    db.run(`INSERT INTO usuarios(cpf, nome, email, cartao) VALUES (?,?,?,?)`, 
            [
                req.body.cpf,
                req.body.nome,
                req.body.email,
                req.body.cartao
            ], (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Erro ao cadastrar usuário.');
        } else {
            console.log('Usuário cadastrado com sucesso!');
            res.status(200).send('Usuário cadastrado com sucesso!');
        }
    });
});

app.get('/usuarios', (req, res, next) => {
    db.all(`SELECT * FROM usuarios`, [], (err, result) => {
        if (err) {
            console.log("Erro: " + err);
            res.status(500).send('Erro ao obter dados de usuários.');
        } else {
            res.status(200).json(result);
        }
    });
});

app.get('/usuarios/:cpf', (req, res, next) => {
    db.get( `SELECT * FROM usuarios WHERE cpf = ?`, req.params.cpf, (err, result) => {
        if (err) { 
            console.log("Erro: "+ err);
            res.status(500).send('Erro ao obter dados de usuários.');
        } else if (result == null) {
            console.log("Usuário não encontrado.");
            res.status(404).send('Usuário não encontrado.');
        } else {
            res.status(200).json(result);
        }
    });
});

app.patch('/usuarios/:cpf', (req, res, next) => {
    if (!validateEmail(req.body.email)) {
        res.status(500).send('Erro ao atualizar cadastro. Email inválido.');
    }

    db.run(`UPDATE usuarios SET email = ? WHERE cpf = ?`,
           [req.body.email, req.params.cpf], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados de usuário.');
            } else if (this.changes == 0) {
                console.log("Usuário não encontrado.");
                res.status(404).send('Usuário não encontrado.');
            } else {
                res.status(200).send('Email alterado com sucesso!');
            }
    });
});

app.delete('/usuarios/:cpf', (req, res, next) => {
    db.run(`DELETE FROM usuarios WHERE cpf = ?`, req.params.cpf, function(err) {
        if (err) { 
            res.status(500).send('Erro ao remover usuário.');
        } else if (this.changes == 0) {
            console.log("Usuário não encontrado.");
            res.status(404).send('Usuário não encontrado.');
        } else {
            res.status(200).send('Usuário removido com sucesso!');
        }
   });
});

const porta = 8082;
app.listen(porta, () => {
    console.log('Servidor em execução na porta: ' + porta);
});
