// tweets、mentionsの高さを変更する
// mentionsには効かないっぽいので修正する
function setHeight() {
  var tweets_top = document.getElementById("tweets").offsetTop;
  var tweets_height = document.body.clientHeight - tweets_top - 4;
  var mentions_top = document.getElementById("mentions").offsetTop;
  var mentions_height = document.body.clientHeight - mentions_top - 4;
  document.getElementById("tweets").style.height = tweets_height;
  document.getElementById("mentions").style.height = mentions_height;
}

window.onresize = function() {
  setHeight();
}
