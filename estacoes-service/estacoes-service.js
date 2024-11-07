const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

let estacaoLiberada = false;

app.get('/estacoes', (req, res, next) => {
    if (estacaoLiberada) {
        res.status(200).send('Estação liberada para uso.');
    } else {
        res.status(200).send('Estação em  uso, aguarde sua vez.')
    }
});

const porta = 8084;
app.listen(porta, () => {
    console.log('Servidor em execução na porta: ' + porta);
});