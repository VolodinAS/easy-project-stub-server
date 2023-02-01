const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')

const app = express()
const cors = require('cors')
require('dotenv').config()

const config = require('../.serverrc')

app.use(cookieParser())
app.options('*', cors())
app.use(cors())

const sess = {
    secret: 'super-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
    },
}
if (app.get('env') === 'production') {
    app.set('trust proxy', 1)
    sess.cookie.secure = true
}
app.use(session(sess))

app.use(bodyParser.json({
    limit: '50mb',
}))
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
}))
app.use(require('./root'))

app.use('/easy-project', require('./routers/easy-project'))

app.use(require('./error'))

app.listen(config.port, () => console.log(`Listening on http://localhost:${config.port}`))
