const { constants } = require('crypto')
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const RateLimit = require('express-rate-limit');
const awsParamStore = require("aws-param-store");
const path = require('path');
const config = require('./config/environments');
const logging = require('./helpers/db_helper');
const x509 = require('./helpers/x509_helper');
const cacheHelper = require('./helpers/cache_helper');
const home = require('./routes/home')
const logs = require('./routes/logs')
const door = require('./routes/door')
const users = require('./routes/users')
const streams = require('./routes/streams')
const motion = require('./routes/motion')
const lights = require('./routes/lights')
const errors = require('./helpers/error_handling')
const env = config.envOptions[config.secrets.environment];
const app = express();
const server = require('https').Server({
    ca: Buffer.from(awsParamStore.getParameterSync( '/epic-shelter-server-ca', config.region).Value, 'utf8'),
    key: Buffer.from(awsParamStore.getParameterSync( '/epic-shelter-server-key', config.region).Value, 'utf8'),
    cert: Buffer.from(awsParamStore.getParameterSync( '/epic-shelter-server-cert', config.region).Value, 'utf8'),
    requestCert: env.sslOptions.requestCert,
    rejectUnauthorized: env.sslOptions.rejectUnauthorized,
    ciphers: [
        "ECDHE-RSA-AES256-SHA384",
        "DHE-RSA-AES256-SHA384",
        "ECDHE-RSA-AES256-SHA256",
        "DHE-RSA-AES256-SHA256",
        "ECDHE-RSA-AES128-SHA256",
        "DHE-RSA-AES128-SHA256",
        "HIGH",
        "!aNULL",
        "!eNULL",
        "!EXPORT",
        "!DES",
        "!RC4",
        "!MD5",
        "!PSK",
        "!SRP",
        "!CAMELLIA"
    ].join(':'),
    honorCipherOrder: true,
    secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1
}, app);

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


// Order matters -> top to bottom
app.use(new RateLimit({
    windowMs: 60*1000, // 1 minute
    max: env.throttle_limit
}));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(helmet.hsts({
    maxAge: 31536000000, //one year
    includeSubDomains: true,
    force: true
}));
if (config.secrets.environment === "dev"){
    app.use('/favicon.ico', express.static('./public/dev-favicon.ico'));
}
app.use(express.static(path.join(__dirname, 'public')));
app.use(x509());
app.use(cacheHelper(env.cache_ttl_seconds));
app.use('/lights', lights);
app.use('/streams', streams);
app.use('/motion', motion);
app.use('/users', users);
app.use('/door', door);
app.use('/logs', logs);
app.use('/', home);
app.use(errors.queryErrors());
app.use(errors.pageNotFound());
app.use(errors.errorHandler());

server.listen(config.PORT);
server.on('listening', function() {
    let addr = server.address();
    let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    logging.append_to_log('Listening on ' + bind, null).then();
});

module.exports = server;