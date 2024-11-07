const express = require('express');
const app = express();

const sqlite3 = require('sqlite3');

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const db = new sqlite3.Database('./postos.db', (err) => {
    if (err) {
        console.log('ERRO: não foi possível conectar ao banco "postos".');
        throw err;
    }
    console.log('Conectado ao banco "postos"!');
});

db.run(`CREATE TABLE IF NOT EXISTS postos 
    (
        id INTEGER PRIMARY KEY NOT NULL UNIQUE,
        nome TEXT NOT NULL, 
        endereco TEXT NOT NULL
    )`, 
    [], (err) => {
       if (err) {
          console.log('ERRO: não foi possível criar tabela "postos".');
          throw err;
       }
});

app.post('/postos', (req, res, next) => {

    let idGerado = 1; 

    db.all(`SELECT * FROM postos`, [], (err, rows) => {
        if (err) {
            console.log("Erro: " + err);
        } else {
            const ids = []

            rows.forEach(row => ids.push(row.id))

            let idGerado = 1;

            for(;;) {
                if(!(ids.includes(idGerado))) {
                    break;
                }
                idGerado++;
            }

            db.run(`INSERT INTO postos(id, nome, endereco) VALUES(?,?,?)`, 
                [
                    idGerado,
                    req.body.nome,
                    req.body.endereco,
                ], (err) => {
                if (err) {
                    console.log("Error: " + err);
                    res.status(500).send('Erro ao cadastrar posto.');
                } else {
                    console.log('Posto cadastrado com sucesso!');
                    res.status(200).send('Posto cadastrado com sucesso!');
                }
            }); 
        }
    });
});

app.get('/postos', (req, res, next) => {
    db.all(`SELECT * FROM postos`, [], (err, result) => {
        if (err) {
            console.log("Erro: " + err);
            res.status(500).send('Erro ao obter dados de postos.');
        } else {
            res.status(200).json(result);
        }
    });
});

app.patch('/postos/:id', (req, res, next) => {
    db.run(`UPDATE postos SET endereco = ? WHERE id = ?`,
           [req.body.endereco, req.params.id], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados de endereço.');
            } else if (this.changes == 0) {
                console.log("Posto não encontrado.");
                res.status(404).send('Posto não encontrado.');
            } else {
                res.status(200).send('Posto alterado com sucesso!');
            }
    });
});

app.delete('/postos/:id', (req, res, next) => {
    db.run(`DELETE FROM postos WHERE id = ?`, req.params.id, function(err) {
        if (err) { 
            res.status(500).send('Erro ao remover posto.');
        } else if (this.changes == 0) {
            console.log("Cliente não encontrado.");
            res.status(404).send('Posto não encontrado.');
        } else {
            res.status(200).send('Posto removido com sucesso!');
        }
   });
});

const porta = 8081;
app.listen(porta, () => {
    console.log('Servidor em execução na porta: ' + porta);
});