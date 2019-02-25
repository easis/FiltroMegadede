console.log('[megafiltro] start');

var g_Config = {
  filters: [],
  need_filter: false,
  xpath: '',
  onLoad: function() { }
};

function get_elements(node, xpath) {
  var result = document.evaluate(xpath, node, null, XPathResult.ANY_TYPE, null);
  var node, nodes = []
  while (node = result.iterateNext()) {
    nodes.push(node);
  }

  return nodes;
}

async function build_xpath() {
  g_Config.need_filter = false;
  g_Config.filter = [];
  var allStorage = await browser.storage.local.get(null).then((results) => {
    if(!results.settings.languages) {
      return;
    }

    Object.keys(results.settings.languages).forEach(function(i) {
      let lang = results.settings.languages[i];
      var filter = '';
      if(lang['filter']) {
        filter = 'contains(img/@src,"'+lang['name']+'")';
      }

      if(lang['filter_sub']) {
        filter = 'contains(img[2]/@src,"'+lang['name']+'")';
      }

      if(filter && g_Config.filters.indexOf(filter) === -1) {
        g_Config.filters.push(filter);
      }
    });
  });

  g_Config.need_filter = (g_Config.filters.length > 0);

  if(g_Config.need_filter) {
    var xpath = '//a[contains(@class,"aporte") and div[@class="language" and ('+g_Config.filters.join(' or ')+')]]';
    g_Config.xpath = xpath;
  } else {
      g_Config.xpath = '';
  }

}

function hide(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if(!g_Config.need_filter) {
        return;
      }

      var elements = get_elements(node, g_Config.xpath);
      for (let i = 0; i < elements.length; i++) {
        elements[i].style.display  = "none";
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        hide(node.childNodes[i]);
      }
    } else if(node.nodeType === Node.TEXT_NODE) {
      let content = node.textContent;
      if(content == 'Blau72') {
        node.textContent = '⭐Blau72';
      }

      if (node.parentNode &&
          node.parentNode.nodeName === 'TEXTAREA') {
          return;
      }
    }
}

function onApplyFilter(request, sender, sendResponse) {
  if(request === 'applyFilter') {
    build_xpath();
    hide(document.body);
  }
}

async function init() {
  browser.runtime.onMessage.addListener(onApplyFilter);

  await build_xpath();
  hide(document.body);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const newNode = mutation.addedNodes[i];
          hide(newNode);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

init();
