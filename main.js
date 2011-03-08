var consumerkey = "PuunbcdiW25qpTGk3evLtg";
var consumerssecret = "CCDH8fEKTFuXTQY5oWj265tCnhcRW1kJEC1cuR8xIlU";
var accesstoken;
var accesstokensecret;

var myID = null;

var lastSinceId = null; // 最後に追加したツイートのID
var mentionSinceId = null;  // 最後に追加したメンションのID

var inreplyto_id = null; // リプライ先
var inreplyto_name = null; // リプライ先のユーザー名

var maxtweets = 20; // 表示するつぶやきの数

// 数字が二桁に満たない場合は最初にゼロを付ける
function addZero(num) {
  if (num < 10) {
    return "0" + num.toString();
  } else {
    return num.toString();
  }
}

// Twitterのユーザー名やURLをリンクにする
var urlRegex = /(http|https):\/\/[^\s]+/g;
var userRegex = /@(\w+)/g;
var hashRegex = /#(\w+)/g;
function autoLink(str) {
  var text1 = str.replace(urlRegex, "<a href=\"$&\" target=\"_blank\">$&</a>");
  var arr = text1.match(hashRegex);
  var text2 = text1;
  for (var i in arr) {
    text2 = text2.replace(arr[i], "<a href=\"http://twitter.com/#!/search?q=" + encodeURIComponent(arr[i]) + "\" target=\"_blank\">" + arr[i] + "</a>");
  }
  return text2.replace(userRegex, "<a target=\"_blank\" href=\"http://twitter.com/$1\">$&</a>");
}

// created_atの時間をJSのDateに変換
function parse_createdat(str) {
  var createdat = str.split(" ");
  var datestr = createdat[1] + " " + createdat[2] + ", " + createdat[5] + " " + createdat[3] + " " + createdat[4];
  return new Date(datestr);
}

// リツイートのテキストを入力
function unofficcial_rt(name, text) {
  var elem = document.getElementById("posttext");
  elem.value = "RT @" + name + ": " + text;
}

// リプライ先を設定
function setReply(name, id) {
  inreplyto_id = id;
  inreplyto_name = name;
  document.getElementById("status").innerHTML = "&nbsp;reply to @" + name;
  document.getElementById("posttext").value = "@" + name;
  posttext_changed(document.getElementById("posttext"));
}
// OAuthの値を追加
function addOAuthParams(method, url, params) {
  var message = {
    method: method,
    action: url,
    parameters: params
  };
  message.parameters.oauth_signature_method = "HMAC-SHA1";
  message.parameters.oauth_consumer_key = consumerkey;
  message.parameters.oauth_token = accesstoken;
  OAuth.setTimestampAndNonce(message);
  var secret = {
    consumerSecret: consumerssecret,
    tokenSecret: accesstokensecret 
  };
  OAuth.SignatureMethod.sign(message, secret);
  return OAuth.getParameterMap(message.parameters);
}

// 公式RT
function retweet(id) {
  var message = {
    method: "POST",
    action: "http://api.twitter.com/1/statuses/retweet/" + id + ".json",
    parameters: {
      oauth_signature_method: "HMAC-SHA1",
      oauth_consumer_key: consumerkey,
      oauth_token: accesstoken,
    }
  };
  OAuth.setTimestampAndNonce(message);
  var secret = {
    consumerSecret: consumerssecret,
    tokenSecret: accesstokensecret 
  };
  OAuth.SignatureMethod.sign(message, secret);
  hash = OAuth.getParameterMap(message.parameters);
  post(message.action, hash);
  document.getElementById("status").innerHTML = "Retweeted";
  window.setTimeout(function() {
    if (document.getElementById("status").innerHTML == "Retweeted") {
      document.getElementById("status").innerHTML = "";
    }
  }, 1000);
}

// Fav追加
function fav(id) {
  var message = {
    method: "POST",
    action: "http://api.twitter.com/1/favorites/create/" + id + ".json",
    parameters: {
      oauth_signature_method: "HMAC-SHA1",
      oauth_consumer_key: consumerkey,
      oauth_token: accesstoken,
    }
  };
  OAuth.setTimestampAndNonce(message);
  var secret = {
    consumerSecret: consumerssecret,
    tokenSecret: accesstokensecret 
  };
  OAuth.SignatureMethod.sign(message, secret);
  hash = OAuth.getParameterMap(message.parameters);
  post(message.action, hash);
  document.getElementById("status").innerHTML = "Favorited";
  window.setTimeout(function() {
    if (document.getElementById("status").innerHTML == "Favorited") {
      document.getElementById("status").innerHTML = "";
    }
  }, 1000);
  var buttons = document.getElementById(id).getElementsByClassName("buttons")[0];
  buttons.removeChild(buttons.getElementsByClassName("fav_link")[0]);
  buttons.innerHTML += "[Favorited]";
}

// つぶやきを追加する。divは追加先divタグのid
function addTweet(twdata, div) {
  var tweetdata = twdata;
  var div_id = "tweets";
  if (arguments.length == 2) {
    div_id = div;
  }
  // リツイートか判定、ユーザー情報を保存、ツイート情報を置き換える
  var isRetweet = (tweetdata["retweeted_status"] != undefined);
  var retweet_user = tweetdata["user"];
  if (isRetweet) {
    tweetdata = tweetdata["retweeted_status"];
  }
  // 要素を組み立てる
  var tweet = document.createElement("div");
  if (tweetdata["text"].match("@" + myID)) {
    tweet.className = "tweet mention";
  } else {
    tweet.className = "tweet";
  }
  // ユーザーアイコン
  var icon = document.createElement("img");
  icon.className = "icon";
  icon.src = tweetdata["user"]["profile_image_url"];
  icon.width = 48;
  icon.height = 48;
  tweet.appendChild(icon);
  // ユーザー名
  var username = document.createElement("span");
  username.className = "tweetuser";
  var userlink = document.createElement("a");
  userlink.href = "http://twitter.com/" + tweetdata["user"]["screen_name"];
  userlink.target = "_blank";
  userlink.innerHTML = tweetdata["user"]["screen_name"];
  username.appendChild(userlink);
  if (isRetweet) {
    username.innerHTML += " by ";
    var link = document.createElement("a");
    link.href = "http://twitter.com/" + retweet_user["screen_name"];
    link.target = "_blank";
    link.innerHTML = retweet_user["screen_name"];
    username.appendChild(link);
  }
  tweet.appendChild(username);
  // 日時
  var twdate = document.createElement("span");
  twdate.className = "tweetdate";
  var createdat = parse_createdat(tweetdata["created_at"]);
  twdate.innerHTML = addZero(createdat.getHours()) + ":" + addZero(createdat.getMinutes()) + ":" + addZero(createdat.getSeconds());
  tweet.appendChild(twdate);
  // リプライとリツイートのボタン
  var buttons = document.createElement("span");
  buttons.className = "buttons";
  var screenname = tweetdata["user"]["screen_name"];
  var text = tweetdata["text"];
  var tweet_id = tweetdata["id_str"]; // id_strがidだと失敗する?
  tweet.id = tweet_id;
  buttons.innerHTML += "<a href=\"javascript:setReply('" + screenname + "', '" + tweet_id + "');\">[Re]</a>&nbsp;";
  buttons.innerHTML += "<a href=\"javascript:retweet('" + tweet_id + "');\">[公式RT]</a>&nbsp;";
  buttons.innerHTML += "<a href=\"javascript:unofficcial_rt('" + screenname + "', '" + text + "');\">[非公式RT]</a>&nbsp;";
  if (tweetdata["favorited"]) {
    buttons.innerHTML += "[Favorited]";
  } else {
    buttons.innerHTML += "<a class=\"fav_link\" href=\"javascript:fav('" + tweet_id + "');\">[Fav]</a>";
  }
  tweet.appendChild(buttons);

  tweet.appendChild(document.createElement("br"));
  text = autoLink(tweetdata["text"]);
  tweettext = document.createElement("span");
  tweettext.className = "tweettext";
  tweettext.innerHTML = text;
  tweet.appendChild(tweettext);
//  tweet.innerHTML += text;
  tweet.appendChild(document.createElement("br"));
  var tweets = document.getElementById(div_id);
  tweets.insertBefore(tweet, tweets.firstChild);

  if (tweets.childNodes.length > maxtweets) {
    tweets.removeChild(tweets.lastChild);
  }
}
// ツイート追加用のコールバック
function callback(data) {
  var sinceid = null;
  for (var i = data.length - 1; i >= 0; i--) {
    tweetdata = data[i]

    sinceid = tweetdata["id"];
    if (i == data.length - 1 && sinceid == lastSinceId) {
      continue;
    }
    addTweet(tweetdata);
  }
  lastSinceId = sinceid;
  removeScriptElem();
}

// メンション追加用のコールバック
function mentioncallback(data) {
  var sinceid = null;
  for (var i = data.length - 1; i >= 0; i--) {
    tweetdata = data[i]

    sinceid = tweetdata["id"];
    //if (i == data.length - 1 && sinceid == lastSinceId) {
    if (i == data.length - 1 && sinceid == mentionSinceId) {
      continue;
    }
    addTweet(tweetdata, "mentions");
  }
  mentionSinceId = sinceid;
  removeScriptElem(1);
}

// TLを取得
function getTL(since_id) {
  var params = {callback: "callback"};
  if (arguments.length != 0) {
    params.since_id = since_id;
  }
  params = addOAuthParams("GET", "http://api.twitter.com/1/statuses/home_timeline.json", params);
  var url = OAuth.addToURL("http://api.twitter.com/1/statuses/home_timeline.json", params);
  jsonp(url);
}
// メンション取得
function getMentions(since_id) {
  var params = {callback: "mentioncallback"};
  if (arguments.length != 0) {
    // mentionの表示が重複する 直す
    params.since_id = since_id;
  }
  params = addOAuthParams("GET", "http://api.twitter.com/1/statuses/mentions.json", params);
  var url = OAuth.addToURL("http://api.twitter.com/1/statuses/mentions.json", params);
  mention_load_count++;
  jsonp(url, 1);
}

// Twitterにツイートを投稿
// inreplytoはリプライ対象のステータスID
function update(str, inreplyto) {
  var replyto = null;;
  if (arguments.length == 2) {
    replyto = inreplyto;
  }
  var params = {status: str};
  if (replyto != null) {
    params["in_reply_to_status_id"] = replyto;
  }
  var hash = addOAuthParams("POST", "http://api.twitter.com/1/statuses/update.xml", params);
  post("http://api.twitter.com/1/statuses/update.xml", hash);
}

// ユーザーが入力した認証用文字列からaccess tokenとsecretを取り出す
function parse_accesstoken(s) {
  var arr = [null, null];
  var str = s.replace(/ /, "");
  arr[0] = str.match(/oauth_token=[a-zA-Z0-9\-]+/)[0].split("=")[1];
  arr[1] = str.match(/oauth_token_secret=[a-zA-Z0-9]+/)[0].split("=")[1];
  arr[2] = str.match(/screen_name=[a-zA-Z0-9_]+/)[0].split("=")[1];
  return arr;
}
window.onload = function() {
  var form = document.createElement("form");
  form.name = "authform";
  form.id = "authform";
  form.innerHTML += "<a href=\"auth.html\" target=\"_blank\">認証ページを開く</a>";
  form.innerHTML += "<br />";
  form.appendChild(document.createTextNode("認証用文字列を入力してください"));
  form.appendChild(document.createElement("br"));
  var text = document.createElement("input");
  text.name = "authtext";
  text.type = "text";
  form.appendChild(text);
  form.appendChild(document.createElement("br"));
  var authButton = document.createElement("input");
  authButton.type = "button";
  authButton.value = "認証";
  authButton.onclick = function() {
    if (document.authform.authtext == "") {
      return;
    }
    var arr = parse_accesstoken(document.authform.authtext.value);
    accesstoken = arr[0];
    accesstokensecret = arr[1];
    myID = arr[2];
    document.body.removeChild(document.getElementById("authform"));
    start();
  }
  form.appendChild(authButton);
  document.body.insertBefore(form, document.body.childNodes[1]);
}
// ツイート投稿、表示を更新
function update_and_load(str) {
  if (inreplyto_name != null) {
    update(str, inreplyto_id);
  } else {
    update(str);
  }
  window.setTimeout(function() {
    if (lastSinceId == null) {
      getTL();
    } else {
      getTL(lastSinceId);
    }
  }, 500);
}
function posttext_changed(posttext) {
  // 入力欄に入力された時
  if (posttext.value.length > 140) {
    document.getElementById("post").disabled = true;
  } else {
    document.getElementById("post").disabled = false;
  }
  if (inreplyto_name != null) {
    if (posttext.value.slice(0, inreplyto_name.length + 1) != "@" + inreplyto_name) {
      document.getElementById("status").innerHTML = "";
      inreplyto_name = null;
      inreplyto_id = null;
    }
  }
}
function start() {
  setHeight();
  document.getElementById("post").addEventListener("click", function() {
    var str = document.getElementById("posttext").value;
    update_and_load(str);
    document.getElementById("posttext").value = "";
    posttext_changed(document.getElementById("posttext"));
  }, false);
  document.getElementById("posttext").addEventListener("keyup", function(e) {
    if (e.ctrlKey && e.keyCode == 13) {
      var str = document.getElementById("posttext").value;
      update_and_load(str);
      document.getElementById("posttext").value = "";
    }
  }, false);
  getTL();
  getMentions();
  window.setInterval(function() {
    if (lastSinceId == null) {
      getTL();
    } else {
      getTL(lastSinceId);
    }
  }, 1000 * 60);
  window.setInterval(function() {
    if (mentionSinceId == null) {
      getMentions();
    } else {
      getMentions(mentionSinceId);
    }
  }, 1000 * 60);
  document.getElementById("posttext").addEventListener("keyup", function(e) {
    // 入力欄に入力された時
    posttext_changed(e.target);
  }, false);
  document.settingform.ok.addEventListener("click", function(e) {
    var num = parseInt(document.settingform.maxtweets.value);
    if (isNaN(num)) {
      alert("数字を入力してください");
      return;
    }
    maxtweets = num;
    var coolcssEnable = document.settingform.coolcss.checked;
    if (coolcssEnable) {
      var link = document.createElement("link");
      link.href = "cool.css";
      link.type = "text/css";
      link.rel = "stylesheet";
      link.id = "cool"
      document.getElementsByTagName("head")[0].appendChild(link);
    } else {
      var coolcss = document.getElementById("cool");
      if (coolcss) {
        document.getElementsByTagName("head")[0].removeChild(coolcss);
      }
    }
  }, false);
}
