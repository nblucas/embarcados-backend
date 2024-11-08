const express = require('express');
const app = express();
const axios = require('axios');

const sqlite3 = require('sqlite3');

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const db = new sqlite3.Database('./recargas.db', (err) => {
    if (err) {
        console.log('ERRO: não foi possível conectar ao banco "recargas".');
        throw err;
    }
    console.log('Conectado ao banco "recargas"!');
});

db.run(`CREATE TABLE IF NOT EXISTS recargas 
    (
        id INTEGER PRIMARY KEY NOT NULL UNIQUE, 
        usuario_cpf TEXT NOT NULL,
        datahora INTEGER NOT NULL
    )`, 
    [], (err) => {
       if (err) {
          console.log('ERRO: não foi possível criar tabela "recargas".');
          throw err;
       }
});

app.post('/recargas', (req, res, next) => {
    let idGerado = 1;

    db.all(`SELECT * FROM recargas`, [], (err, rows) => {
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
            
            axios.get(`http://localhost:8080/usuarios/${req.body.cpf}`)
                .then(function (response) {
                    db.run(`INSERT INTO recargas(id, usuario_cpf, datahora) VALUES(?,?,?)`, 
                            [
                                idGerado,
                                response.data.cpf,
                                Date.now(),
                            ], (err) => {
                        if (err) {
                            console.log("Error: " + err);
                            res.status(500).send('Erro ao cadastrar recarga.');
                        } else {
                            axios.post('http://localhost:8080/cobrancas', {
                                cartao: response.data.cartao,
                                valor: req.body.valor,
                                idRecarga: idGerado,
                            }).then(function (response) {
                                axios.get('http://localhost:8080/estacoes')
                                  .then(function (response) {
                                    res.status(200).send(response.data)
                                  })
                                  .catch(function (error) {
                                    res.status(500).send('Erro ao cadastrar recarga. Problema com comando da estação.');
                                  })
                            }).catch(function (error) {
                                res.status(500).send('Erro ao cadastrar recarga. Problema com registro de cobrança.');
                            })
                        }
                    });
                })
                .catch(function (error) {
                    console.log(error);
                    res.status(500).send('Erro ao processar a recarga.');
                })
        }
    });
});

app.get('/recargas', (req, res, next) => {
    db.all(`SELECT * FROM recargas`, [], (err, result) => {
        if (err) {
            console.log("Erro: " + err);
            res.status(500).send('Erro ao obter dados de recargas.');
        } else {
            res.status(200).json(result);
        }
    });
});

const porta = 8083;
app.listen(porta, () => {
    console.log('Servidor em execução na porta: ' + porta);
});