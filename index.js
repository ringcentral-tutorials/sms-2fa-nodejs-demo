var path = require('path')

if('production' !== process.env.LOCAL_ENV )
  require('dotenv').load();

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var urlencoded = bodyParser.urlencoded({extended: false})

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(urlencoded);

var port = process.env.PORT || 5000

var server = require('http').createServer(app);
server.listen(port);

var rc_engine = require('./engine');
app.get('/', function (req, res) {
  rc_engine.canLogin(res)
})
app.get('/about', function (req, res) {
  res.render('about')
})
app.get('/getseed', function (req, res) {
  rc_engine.getSeed(req, res)
})
app.post('/login', function (req, res) {
  rc_engine.login(req, res)
})
app.post('/resetpwd', function (req, res) {
   rc_engine.resetPwd(req, res)
})
app.post('/verifypasscode', function (req, res) {
   rc_engine.verifyPasscode(req, res)
})
app.post('/resendcode', function (req, res) {
   rc_engine.resendCode(req, res)
})
app.get('/signup', function (req, res) {
   rc_engine.createTable()
   res.render("signup")
})
app.post('/signup', function (req, res) {
   rc_engine.signup(req, res)
})
