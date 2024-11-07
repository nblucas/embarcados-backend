const httpProxy = require('express-http-proxy');
const express = require('express');
const app = express();
var logger = require('morgan');

app.use(logger('dev'));

function selectProxyHost(req) {
    if (req.path.startsWith('/postos'))
        return 'http://localhost:8081/';
    else if (req.path.startsWith('/usuarios'))
        return 'http://localhost:8082/';
    else if (req.path.startsWith('/recargas'))
        return 'http://localhost:8083/';
    else if (req.path.startsWith('/estacoes'))
        return 'http://localhost:8084/';
    else if (req.path.startsWith('/cobrancas'))
        return 'http://localhost:8085/';
    else return null;
}

app.use((req, res, next) => {
    var proxyHost = selectProxyHost(req);
    if (proxyHost == null)
        res.status(404).send('API Gateway não encontrado.');
    else
        httpProxy(proxyHost)(req, res, next);
});

app.listen(8080, () => {
    console.log('API Gateway iniciado!');
});
