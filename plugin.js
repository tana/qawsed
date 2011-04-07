// プラグイン管理
// 未完成
//function Plugins() {
Plugins = {
  plugins: [],
  enabled: [],
  // プラグイン追加
  add: function(plugin) {
    /*if (plugin["init"] != undefined) {
      plugin.init();
    }*/
    this.plugins.push(plugin);
    //this.enabled.push(true);
    var span = document.createElement("span");
    var check = document.createElement("input");
    check.type = "checkbox";
    var num = this.plugins.length - 1;
    check.id = "checkbox_" + num.toString();
    span.appendChild(check);
    span.innerHTML += plugin.name;
    document.getElementById("pluginsetting").appendChild(span);
    document.getElementById("pluginsetting").appendChild(document.createElement("br"));
    var chk = document.getElementById("checkbox_" + num.toString());
    chk.addEventListener("change", function() {
      chk.checked ? Plugins.enable(num) : Plugins.disable(num);
    }, false);
  },
  disable: function(num) {
    if (this.plugins[num]["disable"] != undefined) {
      this.plugins[num].disable();
    }
    this.enabled[num] = false;
  },
  enable: function(num) {
    if (this.plugins[num]["init"] != undefined) {
      this.plugins[num].init();
    }
    this.enabled[num] = true;
  },
  // ツイート追加時に呼ぶ
  tweet: function(data) {
    for (i in this.plugins) {
      if (this.plugins[i]["tweet"] != undefined && this.enabled[i]) {
        this.plugins[i].tweet(data);
      }
    }
  },
  mention: function(data) {
    for (i in this.plugins) {
      if (this.plugins[i]["mention"] != undefined && this.enabled[i]) {
        this.plugins[i].mention(data);
      }
    }
  },
  tab: function(id) {
    for (i in this.plugins) {
      if (this.plugins[i]["tab"] != undefined && this.enabled[i]) {
        this.plugins[i].tab(id);
      }
    }
  }
}

// 何もしないプラグイン
/*function PluginSample() {
  this.name = "pluginsample";
  // 初期化(追加される時、有効になった時)
  this.init = function() {
  };
  this.disable = function() {
  };
  // 新しいツイートが来た時
  this.tweet = function(tweetdata) {
  };
  // 新しいメンションが来た時
  this.mention = function(tweetdata) {
  };
}*/

// 発言と返信、追加先の対応表
var replyhash = {}
// コールバック
function replycallback(data) {
  var val = replyhash[data["id_str"]];
  var tweetid;
  if (val == undefined) {
    // ここはうまくいかないので後で見直す必要あり
    return;
  }
  if (val[1] == "") {
    tweetid = val[0];
  } else {
    tweetid = val[1] + "_" + val[0];
  }
  var tweet = document.getElementById(tweetid);
  var replydiv = document.createElement("div");
  var icon = document.createElement("img");
  icon.width = 24;
  icon.height = 24;
  icon.src = data["user"]["profile_image_url"];
  icon.className = "icon";
  replydiv.appendChild(icon);
  var text = document.createElement("span");
  text.className = "tweettext";
  text.innerHTML += autoLink(data["text"]);
  replydiv.appendChild(text);
  replydiv.style.clear = "both";
  var div = document.createElement("div");
  div.style.clear = "both";
  replydiv.appendChild(div);
  tweet.appendChild(document.createElement("div"));
  tweet.appendChild(replydiv);
  delete replyhash[data["id_str"]];
  removeScriptElem(2);
}
function ShowReply() {
  this.name = "返信先を表示(APIを多く消費します)";
  this.tweet = function(tweetdata) {
    var replyid = tweetdata["in_reply_to_status_id_str"];
    if (replyid == null) {
      return;
    }
    replyhash[replyid] = [tweetdata["id_str"], ""];
    jsonp("http://api.twitter.com/1/statuses/show/" + replyid + ".json?callback=replycallback", 2);
  }
  this.mention = function(tweetdata) {
    var replyid = tweetdata["in_reply_to_status_id_str"];
    if (replyid == null) {
      return;
    }
    replyhash[replyid] = [tweetdata["id_str"], "mentions"];
    jsonp("http://api.twitter.com/1/statuses/show/" + replyid + ".json?callback=replycallback", 2);
  }
}
function NotifyPlugin() {
  // ここはうまくいかないので後で見直す必要あり
  this.name = "デスクトップ通知(Chrome専用)";
  this.enable = true;
  this.init = function() {
    window.webkitNotifications.requestPermission(function() {
      if (window.webkitNotifications.checkPermission() == 0) {
        this.enable = true;
      } else {
        this.enable = false;
      }
    });
  }
  this.disable = function() {
    this.enable = false;
  }
  this.mention = function(data) {
    if (this.enable) {
      var popup = window.webkitNotifications.createNotification(data["user"]["profile_image_url"], "Qawsed", data["user"]["screen_name"] + "から返信があります");
      popup.show();
      window.setTimeout(function() {
        popup.cancel();
      }, 5000);
    }
  }
}
function Thumbnail() {
  this.name = "画像投稿サービスの画像のサムネイルを表示";
  function addthumbnail(data, prefix) {
    if (data["retweeted_status"] != undefined) {
      data = data["retweeted_status"];
    }
    var elem = document.getElementById(prefix + data["id_str"]);
    var textelem = elem.getElementsByClassName("tweettext")[0];
    var text = data["text"];
    var twitpicURLs = text.match(/http:\/\/twitpic\.com\/\w+/g);
    for (i in twitpicURLs) {
      var img = document.createElement("img");
      var str = twitpicURLs[i];
      img.src = "http://twitpic.com/show/thumb/" + str.slice(str.lastIndexOf("/") + 1, str.length);
      textelem.appendChild(document.createElement("br"));
      textelem.appendChild(img);
    }
    var instagramURLs = text.match(/http:\/\/instagr\.am\/p\/[\w\-]+\//g);
    for (i in instagramURLs) {
      var img = document.createElement("img");
      var str = instagramURLs[i];
      img.src = str + "media/?size=t";
      textelem.appendChild(document.createElement("br"));
      textelem.appendChild(img);
    }
  }
  this.mention = function(data) { addthumbnail(data, "mentions_"); };
  this.tweet = function(data) { addthumbnail(data, ""); };
}
function TitleNotify() {
  this.name = "リプライが来た時にタイトルを変更";
  this.count = 0;
  this.enable = function() {
    this.count = 0;
  }
  this.mention = function(data) {
    this.count++;
    document.title = "(" + this.count.toString() + ")Qawsed";
  };
  this.tab = function(id) {
    if (id == "tab_mentions") {
      this.count = 0;
      document.title = "Qawsed";
    }
  };
}
window.addEventListener("load", function() {
  Plugins.add(new NotifyPlugin());
  Plugins.add(new ShowReply());
  Plugins.add(new Thumbnail());
  Plugins.add(new TitleNotify());
}, false);
