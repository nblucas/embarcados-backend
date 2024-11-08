const express = require('express');
const app = express();
const axios = require('axios');

const sqlite3 = require('sqlite3');

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const db = new sqlite3.Database('./cobrancas.db', (err) => {
    if (err) {
        console.log('ERRO: não foi possível conectar ao banco "cobrancas".');
        throw err;
    }
    console.log('Conectado ao banco "cobrancas"!');
});

db.run(`CREATE TABLE IF NOT EXISTS cobrancas 
    (
        id INTEGER PRIMARY KEY NOT NULL UNIQUE, 
        id_reserva INTEGER NOT NULL,
        cartao TEXT NOT NULL,
        valor REAL NOT NULL
    )`, 
    [], (err) => {
       if (err) {
          console.log('ERRO: não foi possível criar tabela "cobrancas".');
          throw err;
       }
});

app.post('/cobrancas', (req, res, next) => {
    let idGerado = 1; 

    db.all(`SELECT * FROM cobrancas`, [], (err, rows) => {
        if (err) {
            console.log("Erro: " + err);
        } else {
            const ids = []

            rows.forEach(row => ids.push(row.id))

            for(;;) {
                if(!(ids.includes(idGerado))) {
                    break;
                }
                idGerado++;
            }
            
            db.run(`INSERT INTO cobrancas(id, id_reserva, cartao, valor) VALUES(?,?,?,?)`, 
                    [
                        idGerado,
                        req.body.idRecarga,
                        req.body.cartao,
                        req.body.valor
                    ], (err) => {
                if (err) {
                    console.log("Error: " + err);
                    res.status(500).send('Erro ao cadastrar cobrança.');
                } else {
                    res.status(200).send('Cobrança cadastrada com sucesso!')
                }
            });
        }
    });
});

app.get('/cobrancas', (req, res, next) => {
    db.all(`SELECT * FROM cobrancas`, [], (err, result) => {
        if (err) {
            console.log("Erro: " + err);
            res.status(500).send('Erro ao obter dados de cobrancas.');
        } else {
            res.status(200).json(result);
        }
    });
});

app.get('/cobrancas/:cartao', (req, res, next) => {
    db.all( `SELECT * FROM cobrancas WHERE cartao = ?`, req.params.cartao, (err, result) => {
        if (err) { 
            console.log("Erro: "+ err);
            res.status(500).send('Erro ao obter dados de usuários.');
        } else if (result == null) {
            console.log("Cobrança(s) não encontrada(s).");
            res.status(404).send('Cobrança(s) não encontrada(s).');
        } else {
            res.status(200).json(result);
        }
    });
});

const porta = 8085;
app.listen(porta, () => {
    console.log('Servidor em execução na porta: ' + porta);
});