var rc_engine = require('./engine');
module.exports = function (app) {

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
  app.post('/verifypass', function (req, res) {
     rc_engine.verifyPass(req, res)
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
}
