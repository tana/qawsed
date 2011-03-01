// JSONPでデータ取得
// numbは番号 removeScriptElemの時に使う
function jsonp(url, numb) {
  var num;
  if (arguments.length == 1) {
    num = 0;
  } else {
    num = numb;
  }
  var element = document.createElement("script");
  element.className = "jsonp_data" + num.toString();
  element.src = url;
  element.type = "text/javascript";
  document.getElementsByTagName("head")[0].appendChild(element);
  //console.log(url);
}
// いらないscript要素を消す jsonpのコールバックの最後で呼ぶ必要がある
// numbは番号 jsonpの時と同じ数字を使う
function removeScriptElem(numb) {
  var num;
  if (arguments.length == 0) {
    num = 0;
  } else {
    num = numb;
  }
  var scripts = document.getElementsByClassName("jsonp_data" + num.toString());
  var head = document.getElementsByTagName("head")[0];
  head.removeChild(scripts[0]);
}

// クロスドメインでPOST 結果の取得はできない document.onloadより後に呼ぶ
function post(url, params) {
  // accept-charsetが無いとOperaでエラーになる
  var form = "<form method=\"POST\" action=\"" + url + "\" accept-charset=\"utf-8\">";
  for (var i in params) {
    form = form + "<input type=\"hidden\" name=\"" + i + "\" value=\"" + params[i] + "\" />";
  }
  form = form + "</form>";
  form = form + "<script>window.onload = function() {document.forms[0].submit();}</script>";
  var iframe;
  iframe = document.createElement("iframe");
  iframe.id = "crossdomain_post";
  iframe.style.display = "none";
  document.body.appendChild(iframe);
  var doc = iframe.contentDocument;
  doc.open();
  doc.write(form);
  doc.close();
}
