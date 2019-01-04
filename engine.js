var sha256 = require("crypto-js/sha256");
const sqlite3 = require('sqlite3').verbose();
var USER_DATABASE = './db/users.db';
const OK = 0
const FAILED = 1
const LOCKED = 2
const INVALID = 3
const UNKNOWN = 4
const MAX_FAILURE = 2

var engine = module.exports = {
    getSeed: function(req, res){
      let db = new sqlite3.Database(USER_DATABASE);
      var query = 'CREATE TABLE if not exists seeds (id INT PRIMARY KEY, seed DateTime NOT NULL)'
      db.run(query, function(err, result){
        var date = new Date()
        var dateStr = date.toISOString()
        var id = generateRandomCode(5)
        var query = "INSERT INTO seeds VALUES (" + id + ",'" + dateStr + "')";
        db.run(query, function(err, result) {
          db.close()
          if (err){
            databaseError(res)
            return console.error(err.message);
          }
          var seedObj = {
            id: id,
            seed: dateStr
          }
          res.send(JSON.stringify(seedObj))
        });
      });
    },
    login: function (req, res) {
      let db = new sqlite3.Database(USER_DATABASE);
      var inPassword = req.body.password
      var email = req.body.username
      var query = "SELECT * FROM seeds WHERE id=" + req.body.id;
      db.get(query, function(err, result) {
        if (err){
          databaseError(res)
          return console.error(err.message);
        }
        var seedStr = result.seed
        query = "DELETE FROM seeds WHERE id=" + result.id;
        db.run(query, function(err) {
          if (err)
            console.error(err.message);
        });
        query = "SELECT phoneno, pwd, failure, locked, code FROM users WHERE email='" + email + "' LIMIT 1";
        db.get(query, function(err, result) {
          if (err){
            databaseError(res)
            return console.error(err.message);
          }
          if (!result){
            //response['error'] = FAILED
            //response['message'] = "Wrong user name and password combination. Please try again."
            //return res.send(JSON.stringify(response))
            var message = "Wrong user name and password combination. Please try again."
            return res.send(createResponse(FAILED, message))
          }
          if (result.locked == 1){
            var maskPhoneNumber = result.phoneno
            for (var i=0; i<maskPhoneNumber.length-4; i++){
              maskPhoneNumber = maskPhoneNumber.substr(0, i) + 'X' + maskPhoneNumber.substr(i + 1);
            }
            var message = "Your account is temporarily locked. A verification code was sent to your mobile phone number " + maskPhoneNumber + ". Please enter the verification code to unclock your account."
            sendSMSMessage(res, db, result.phoneno, message)
          }else{
            var hashed = sha256(result.pwd, seedStr);
            if (inPassword == hashed){
              query = "UPDATE users SET failure= 0, locked= 0, code=0, codeexpiry=0 WHERE email='" + email + "'";
              db.run(query, function(err) {
                if (err){
                  databaseError(res)
                  return console.error(err.message);
                }
                db.close()
                //response['error'] = OK
                //response['message'] = "Welcome back."
                //return res.send(JSON.stringify(response))
                var message = "Welcome back."
                return res.send(createResponse(OK, message))
              });
            }else{
              var failure = result.failure
              // increase failure count
              failure += 1
              var query = ""
              if (failure >= MAX_FAILURE){
                query = "UPDATE users SET failure= 0, locked= 1 WHERE email='" + email + "'";
              }else {
                query = "UPDATE users SET failure= " + failure + " WHERE email='" + email + "'";
              }
              db.run(query, function(err) {
                if (err){
                  databaseError(res)
                  return console.error(err.message);
                }
                db.close()
                //response['error'] = FAILED
                //response['message'] = "Wrong user name and password combination. Please try again."
                //res.send(JSON.stringify(response))
                var message = "Wrong user name and password combination. Please try again."
                return res.send(createResponse(FAILED, message))
              });
            }
          }
        });
      });
    },
    resetPwd: function (req, res) {
      let db = new sqlite3.Database(USER_DATABASE);
      var email = req.body.username
      var query = "SELECT phoneno, code, codeexpiry FROM users WHERE email='" + email + "' LIMIT 1";
      db.get(query, function(err, result) {
        if (err){
          databaseError(res)
          return console.error(err.message);
        }
        if (!result){
          var message = "Account does not exist."
          return res.send(createResponse(UNKNOWN, message))

        }
        var pwd = req.body.pwd
        var code = req.body.code
        if (pwd === undefined && code === undefined){
          var maskPhoneNumber = result.phoneno
          for (var i=0; i<maskPhoneNumber.length-4; i++){
            maskPhoneNumber = maskPhoneNumber.substr(0, i) + 'X' + maskPhoneNumber.substr(i + 1);
          }
          var message = "A verification code was sent to your mobile phone number " + maskPhoneNumber + ". Please enter the verification code to reset your password.";
          sendSMSMessage(res, db, result.phoneno, message)
        }else{
          var timeStamp = Math.floor(Date.now() / 1000)
          var gap = timeStamp - result.codeexpiry
          if (gap < 3600){
            if (code > 100000 && code == result.code){
              var query = "UPDATE users SET pwd= '" + pwd + "', code=0, locked=0, failure=0, codeexpiry=0 WHERE email='" + email + "'";
              db.run(query, function(err) {
                db.close()
                if (err){
                  databaseError(res)
                  return console.error(err.message);
                }
                var message = "Password changed successfully."
                res.send(createResponse(OK, message))
              });
            }else{
              var query = "UPDATE users SET code= 0, codeexpiry= 0 WHERE email='" + email + "'";
              db.run(query, function (err) {
                db.close()
                if (err){
                  databaseError(res)
                  return console.error(err.message);
                }
                var message = "Invalid verification code. Click resend to get a new verification code."
                res.send(createResponse(INVALID, message))
              });
            }
          }else{
            db.close()
            var message = "Verification code expired. Click resend to get a new verification code."
            res.send(createResponse(INVALID, message))
          }
        }
      });
    },
    verifyPasscode: function (req, res) {
      let db = new sqlite3.Database(USER_DATABASE);
      var inPasscode = req.body.passcode
      var email = req.body.username
      var query = "SELECT locked, code, codeexpiry FROM users WHERE email='" + email + "' LIMIT 1";
      db.get(query, function (err, result) {
        if (err){
          databaseError(res)
          return console.error(err.message);
        }
        if (result.locked == 0){
            var message = "Please login."
            res.send(createResponse(OK, message))
          }
        else{
          if (inPasscode){
            var timeStamp = Math.floor(Date.now() / 1000)
            var gap = timeStamp - result.codeexpiry
            if (gap < 3600){
              if (inPasscode > 100000 && result.code == inPasscode){
                var query = "UPDATE users SET failure=0, locked=0, code=0, codeexpiry=0 WHERE email='" + email + "'";
                db.run(query, function (err) {
                  db.close()
                  if (err){
                    databaseError(res)
                    return console.error(err.message);
                  }
                  var message = "Please login."
                  res.send(createResponse(OK, message))
                });
              }else{
                var query = "UPDATE users SET code=0, codeexpiry=0 WHERE email='" + email + "'";
                db.run(query, function (err) {
                  db.close()
                  if (err){
                    databaseError(res)
                    return console.error(err.message);
                  }
                  var message = "Invalid verification code. Click resend to get a new verification code."
                  res.send(createResponse(INVALID, message))
                });
              }
            }else{
              db.close()
              var message = "Verification code expired. Click resend to get a new verification code."
              res.send(createResponse(INVALID, message))
            }
          }else{
            db.close()
            var message = "Invalid verification code. Not set"
            res.send(createResponse(FAILED, message))
          }
        }
      });
    },
    resendCode:function(req, res) {
      let db = new sqlite3.Database(USER_DATABASE);
      var email = req.body.username
      var query = "SELECT phoneno FROM users WHERE email='" + email + "' LIMIT 1";
      var thisRes = res
      db.get(query, function (err, result) {
        if (err){
          databaseError(res)
          return console.error(err.message);
        }
        var message = "Please check your SMS for verification code to unclock your account."
        sendSMSMessage(res, db, result.phoneno, message)
      });
    },
    canLogin:function(res) {
      let db = new sqlite3.Database(USER_DATABASE, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          engine.createTable()
          res.render('signup')
        }else{
          res.render("index")
        }
      });
    },
    createTable: function(){
      let db = new sqlite3.Database('./db/users.db');
      var query = 'CREATE TABLE if not exists users (id INT AI PRIMARY KEY, phoneno VARCHAR(12) UNIQUE NOT NULL, email VARCHAR(64) UNIQUE NOT NULL, pwd VARCHAR(256) NOT NULL, fname VARCHAR(48) NOT NULL, lname VARCHAR(48) NOT NULL, failure INT DEFAULT 0, locked INT DEFAULT 0, code INT11 DEFAULT 0, codeexpiry DOUBLE DEFAULT 0)'
      db.run(query);
    },
    signup: function (req, res) {
      let db = new sqlite3.Database('./db/users.db');
      var valStr = "NULL,'" + req.body.phoneno + "',"
      valStr += "'" + req.body.email + "',"
      valStr += "'" + req.body.password + "',"
      valStr += "'" + req.body.fname + "',"
      valStr += "'" + req.body.lname + "',0,0,0,0"
      var query = "INSERT INTO users VALUES ("+ valStr +")";
      db.run(query, function(err) {
        db.close()
        if (err) {
          databaseError(res)
          return console.error(err.message);
        }else{
          var message = "Congratulations."
          res.send(createResponse(OK, message))
        }
      });
    }
};

function generateRandomCode(digits) {
  const randomize = require('randomatic');
  var code = randomize('0', digits);
  return code
}

function sendSMSMessage (res, db, toNumber, message) {
  var RC = require('ringcentral');
  // Instantiate RC-SDK
  var rcsdk = null
  if (process.env.ENVIRONMENT_MODE == "production"){
    rcsdk = new RC({
      server:RC.server.production,
      appKey: process.env.CLIENT_ID_PROD,
      appSecret:process.env.CLIENT_SECRET_PROD,
    })
  }else{
    rcsdk = new RC({
        server:RC.server.sandbox,
        appKey: process.env.CLIENT_ID_SB,
        appSecret:process.env.CLIENT_SECRET_SB
      })
  }
  var platform = rcsdk.platform();
  var thisRes = res
  var username, pwd = ""
  if (process.env.ENVIRONMENT_MODE == "production"){
    username= process.env.USERNAME_PROD
    pwd= process.env.PASSWORD_PROD
  }else{
    username= process.env.USERNAME_SB
    pwd= process.env.PASSWORD_SB
  }

  platform.login({
    username:username,
    password:pwd
    })
    .then(function(authResponse) {
      var code = generateRandomCode(6)
      platform.post('/account/~/extension/~/sms',
        {
          from: {'phoneNumber': username},
          to: [{'phoneNumber': toNumber}],
          text: "Your verification code is " + code
        })
        .then(function (response) {
          var timeStamp = Math.floor(Date.now() / 1000)
          var query = "UPDATE users SET code= " + code + ", codeexpiry= " + timeStamp + " WHERE phoneno='" + toNumber + "'";
          db.run(query, function(err) {
            if (err) {
              databaseError(thisRes)
              return console.error(err.message);
            }
            db.close()
          });
          thisRes.send(createResponse(LOCKED, message))
        });
      })
      .catch(function(e) {
          var message = "Cannot send verification code. Please click the Resend button to try again."
          thisRes.send(createResponse(UNKNOWN, message))
    });
}

function databaseError(res){
  var response = {
      'error': UNKNOWN,
      'message': "User database error. Please try again."
      }
  res.send(JSON.stringify(response))
}

function createResponse(error, message){
    var response = {
        'error': error,
        'message': message
    }
    return JSON.stringify(response)
}
