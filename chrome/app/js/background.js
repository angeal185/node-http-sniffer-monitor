let config = {
  has_change: false,
  post_url: 'https://localhost:5000',
  method: 'POST',
  post_interval: 10000,
  headers: [
    'initiator','method','requestHeaders',
    'responseHeaders', 'timeStamp','type',
    'url','extraHeaders', 'statusCode',
    'statusLine', 'ip', 'statusText'
  ],
  fetch: {
    'Content-type': 'application/json',
    'Sec-Fetch-Dest': 'object',
    'Sec-Fetch-Mode': 'cors',
    'X-API': 'xxxx'
  }
}

let cache = {
  data: []
}

const utils = {
  debounce(func, wait, immediate) {
    let timeout;
    return function() {
      let context = this,
      args = arguments,
      later = function() {
        timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      }
      let callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if(callNow){
        func.apply(context, args);
      }
    }
  }
}

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({data:[]}, function(res) {
    console.log('http-passive-sniffer installed')
  })
});

window.addEventListener("store-data", utils.debounce(function(evt) {

  chrome.storage.local.get(function(res){
    res['data'] = res['data'].concat(cache['data']);
    chrome.storage.local.set(res);
    console.log(cache);
    cache['data'] = [];
  })

  config.has_change = true;

},3000));

// request sniffer
chrome.webRequest.onSendHeaders.addListener(function (headers){

  if(!headers.url.match(config.post_url)){
    let obj = {},
    item = config.headers;

    for (let i = 0; i < item.length; i++) {
      if(headers[item[i]]){
        obj[item[i]] = headers[item[i]];
      }
    }

    cache.data.push(obj);
    window.dispatchEvent(new CustomEvent("store-data"));
  }

}, {urls: ["<all_urls>"]}, ["requestHeaders", "extraHeaders"]);

// response sniffer
chrome.webRequest.onCompleted.addListener(function (headers){

  if(!headers.url.match(config.post_url)){
    let obj = {},
    item = config.headers;

    for (let i = 0; i < item.length; i++) {
      if(headers[item[i]]){
        obj[item[i]] = headers[item[i]];
      }
    }

    cache.data.push(obj);
    window.dispatchEvent(new CustomEvent("store-data"));
  }

}, {urls: ["<all_urls>"]}, ["responseHeaders", "extraHeaders"]);

setInterval(function(){

  if(config.has_change){
    chrome.storage.local.get(['data'],function(res){

      fetch(config.post_url, {
        method: 'POST',
        mode: 'cors',
        headers: config.fetch,
        body: JSON.stringify({data:res})
      })
      .then(function(res){
        if (res.status >= 200 && res.status < 300) {
          return res.json();
        } else {
          return Promise.reject(new Error(res.statusText))
        }
      })
      .then(function(data){

        if(data.success){
          chrome.storage.local.get(function(res){
            res['data'] = [];
            chrome.storage.local.set(res);
          })
          config.has_change = false;
        }

      })
      .catch(function(err){
        return;
      })

    })
  }

},config.post_interval)


chrome.tabs.onUpdated.addListener(function(id, changeInfo) {

  if(changeInfo.status === 'complete'){
    chrome.tabs.executeScript(id, {
      allFrames: true,
      file: 'app/js/main.js'
    });
  }
});
