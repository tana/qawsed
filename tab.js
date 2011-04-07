var activetab;
function tabClicked(e) {
  var elem = e.target;
  if (elem.className == "active_tab") {
    return;
  }
  if (elem.id == "tab_home") {
    document.getElementById("tweets").style.display = "block";
    document.getElementById("mentions").style.display = "none";
    document.getElementById("setting").style.display = "none";
    setHeight();
    Plugins.tab("tab_home");
  } else if (elem.id == "tab_mentions") {
    document.getElementById("mentions").style.display = "block";
    document.getElementById("tweets").style.display = "none";
    document.getElementById("setting").style.display = "none";
    setHeight();
    Plugins.tab("tab_mentions");
  } else if (elem.id == "tab_setting") {
    document.getElementById("mentions").style.display = "none";
    document.getElementById("tweets").style.display = "none";
    document.getElementById("setting").style.display = "block"
    setHeight();
    Plugins.tab("tab_setting");
  }
  activetab.className = "tab";
  elem.className = "active_tab";
  activetab = elem;
}
window.addEventListener("load", function() {
  activetab = document.getElementById("tabs").getElementsByClassName("active_tab")[0];
  var tabs = document.getElementById("tabs").childNodes;
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener("click", tabClicked, false);
  }
}, false);
