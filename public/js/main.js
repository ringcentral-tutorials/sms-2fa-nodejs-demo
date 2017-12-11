window.onload = init;
const OK = 0
const FAILED = 1
const LOCKED = 2
const INVALID = 3
const UNKNOWN = 4
var email = ""
function init() {
  $("#info_label").hide()
}

function getSeed(){
  email = $("#username").val()
  if (email == ""){
    alert("Missing email address.")
    return
  }
  $("#info_label").hide()
  $("#info_label").html("")
  var url = "getseed";
  var posting = $.get(url);
  posting.done(function( response ) {
    var json = JSON.parse(response);
    var temp = CryptoJS.SHA256($("#password").val(), "").toString(CryptoJS.enc.Hex);
    var digest = CryptoJS.SHA256(temp, json.seed).toString(CryptoJS.enc.Hex);
    login(json.id, digest)
  });
  posting.fail(function(response){
    alert(response.statusText);
  });
}

function login(id, hashed){
  var url = "login";
  var data = {
    username: email,
    password: hashed,
    id: id
  }
  var posting = $.post( url, data );
  posting.done(function( response ) {
    var json = JSON.parse(response);
    if (json.error == OK){
      window.location.assign("about")
    }else if (json.error == FAILED){
      $("#info_label").show()
      $("#info_label").html(json.message)
    }else if (json.error == LOCKED){
      $("#login").hide()
      $("#info_label_vc").html(json.message)
      $("#info_label_vc").show()
      $('#verification').show()
    }
  });
  posting.fail(function(response){
    alert(response.statusText);
  });
}

function signup(){
  var url = "signup";
  var temp = $("#password").val()
  if (temp == ""){
    alert("Missing password.")
    return
  }
  if ($("#email").val() == ""){
    alert("Missing email address.")
    return
  }
  if ($("#phoneno").val() == ""){
    alert("Missing phone number.")
    return
  }
  var hashed = CryptoJS.SHA256(temp, "").toString(CryptoJS.enc.Hex);
  var data = {
    email: $("#email").val(),
    password: hashed,
    phoneno: $("#phoneno").val(),
    fname: $("#fname").val(),
    lname: $("#lname").val()
  }
  var posting = $.post( url, data );
  posting.done(function( response ) {
    var json = JSON.parse(response);
    if (json.error == OK){
      window.location.assign("/")
    }else{
      alert(json.message)
    }
  });
  posting.fail(function(response){
    alert(response.statusText);
  });
}

function verifyPasscode() {
  var url = "verifypasscode";
  if (email != ""){
    var data = {
      username: email,
      passcode: $("#passcode").val()
    }
    var posting = $.post( url, data );
    posting.done(function( response ) {
      var json = JSON.parse(response);
      if (json.error == OK){
        window.location.assign("/")
      }else{
        $("#info_label_vc").html(json.message)
        $("#info_label_vc").show()
      }
    });
    posting.fail(function(response){
      alert(response.statusText);
    });
  }
}

function resendCode(){
  var url = "resendcode";
  if (email != ""){
    var data = {
      username: email
    }
    var posting = $.post( url, data );
    posting.done(function( response ) {
      var json = JSON.parse(response);
      $("#info_label_cp").html(json.message)
      $("#info_label_cp").show()
      $("#info_label_vc").html(json.message)
      $("#info_label_vc").show()
    });
    posting.fail(function(response){
      alert(response.statusText);
    });
  }
}

function resetPassword() {
  $("#login").hide()
  $("#resetpwd").show()
  $("#verification_cp").hide()
}

function resetPwd() {
  email = $("#username_cp").val()
  var url = "resetpwd";
  if (email != ""){
    var data = {
      username: email
    }
    if ($("#verification_cp").is(":visible")){
      var temp = $("#password_cp").val()
      var hashed = CryptoJS.SHA256(temp, "").toString(CryptoJS.enc.Hex);
      data.pwd = hashed
      data.code = $("#code_cp").val()
    }
    var posting = $.post( url, data );
    posting.done(function( response ) {
      var json = JSON.parse(response);
      if (json.error == OK){
        $("#resetpwd").hide()
        $("#info_label").show()
        $("#login").show()
      }else if (json.error == UNKNOWN){
        $("#info_label_cp").html(json.message)
      }else{
        $("#verification_cp").show()
        $("#info_label_cp").html(json.message)
        $("#info_label_vc").show()

      }
    });
    posting.fail(function(response){
      alert(response.statusText);
    });
  }
}
