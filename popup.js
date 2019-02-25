var g_DefaultSettings = {
  settings: {
    languages: {
       'en': { 'short': 'en', 'name': 'english',  'image': 'en.png', 'filter': false, 'filter_sub': false },
       'es': { 'short': 'es', 'name': 'spanish',  'image': 'es.png', 'filter': false, 'filter_sub': false },
       'mx': { 'short': 'mx', 'name': 'spanish',  'image': 'mx.png', 'filter': false, 'filter_sub': false },
       'jp': { 'short': 'jp', 'name': 'japanese', 'image': 'jp.png', 'filter': false, 'filter_sub': false },
   }
  }
};
var g_StoredSettings = {};

//browser.storage.local.clear();
init();

/* init */
async function init() {
  browser.storage.onChanged.addListener(onSettingsChanged);
  await browser.storage.local.get().then(onSettings);

  Object.keys(g_StoredSettings.settings.languages).forEach(function(i) {
    let lang = g_StoredSettings.settings.languages[i];
    addRow(lang);

    let filter_lang = document.getElementById('filter_' + lang['short']);
      if(filter_lang) {
          filter_lang.checked = lang['filter'];
      }

      let filter_sub = document.getElementById('filter_' + lang['short'] + '_sub');
      if(filter_sub) {
          filter_sub.checked = lang['filter_sub'];
      }
  });
}

async function onSettings(result) {
  if(!result.settings) {
    await browser.storage.local.set(g_DefaultSettings);
  } else {
    g_StoredSettings = result;
  }
}

async function onSettingsChanged(newSettings) {
  var storedSettings = await browser.storage.local.get('settings').then((result) => {
    if(result.settings) {
      g_StoredSettings = result;
    }
  });
}

/** languages **/
function get_stored_languages() {
  return g_StoredSettings.settings.languages;
}

function get_stored_language(language) {
  return g_StoredSettings.settings.languages[language];
}

async function updateSettings() {
  await browser.storage.local.set(g_StoredSettings);
}

function addRow(lang) {
  var lang_table = document.getElementById('languages');
  var lastRow = lang_table.insertRow();

  var langCell = lastRow.insertCell();
  langCell.innerHTML = '<input type="checkbox" id="filter_'+ lang['short'] + '"/>';
  addListener(langCell.firstChild, lang);
  lastRow.insertCell().innerHTML = '<img src="icons/' + lang['image'] + '"/> ' + (lang['text'] || '');

  var subCell = lastRow.insertCell();
  subCell.innerHTML = '<input type="checkbox" id="filter_'+ lang['short'] + '_sub"/>';
  addListener(subCell.firstChild, lang, true);
  lastRow.insertCell().innerHTML = '<div id="container"><img src="icons/' + lang['image'] + '"/><p id="text">SUB</p></div>';
}

function addListener(checkLang, lang, is_sub = false) {
  if(checkLang) {
    checkLang.addEventListener('change', applyFilter(lang, is_sub), false);
  }
}

var applyFilter = function(lang, is_sub) {
  return async function curried_func(e) {
    if(!g_StoredSettings.settings) {
        //return;
    }

    var currentLang = g_StoredSettings.settings.languages[lang['short']];

    g_StoredSettings.settings.languages[lang['short']]['filter'] = is_sub ? currentLang['filter'] : this.checked;
    g_StoredSettings.settings.languages[lang['short']]['filter_sub'] = is_sub ? this.checked : currentLang['filter_sub'];

    updateSettings();

    sendMessage('applyFilter');
  }
}

function getActiveTab() {
  return browser.tabs.query({active: true, currentWindow: true});
}

async function sendMessage(message) {
  await getActiveTab().then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, message);
  });
}
