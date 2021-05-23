# Fract JS

A small and simple javascript library for supporting dynamic DOM rendering from server-side.

## Short Description

You can update DOM of HTML pages with this library just only by a well-formatted JSON data as a response from your server.
Your client-side task are only putting `data-fract-id` on elements you want update dynamically and using one of following functions:

* Handle your server response by the `handleFractResponse` function of fract.js
* Send your request from Javascript by the `send` function of fract.js. The function automatically handle the response.
* Send your HTML Form by the `sendForm` function of fract.js. The function automatically handle the response.

Your server-side handler must return a well-formed response like:

```json
{"components": {"flash-message": "<p data-fract-id='flash'>An error occurred!!</p>"}}
```

fract.js will find elements which have same data-fract-id with keys of the `components` object of the response, and replace them with the HTML string of the `components` object. It's simple.


## Motivation

Single Page Application by Javascript becomes more and more popular in current time, but not all usecase need SPA. It might be a situation that you want a small web apps for your business, you don't need SPA and don't want to prepare the complicated build environments for both of Client-side and Server-side, but just simply want to build a small server-side app, this library help you.

Your task for client-side is only importing functions from Fract.js and use the functions for sending to or receiving from server-side. You can program all other things at Server-side.

You can concentrate on your server-side program, and can update client-side DOM easily from server-side just by sending well-formed JSON responses.

## Why 2 JS files exist

The mainstream script of this project is `fract.js`. This works only on modern web browsers because it uses newer ECMAscript functions like `let`, `const`, `Fetch API` and others.

But if you or your business never allow users using newest browsers for some reasons, you can use `fract-jquery.js` instead of `fract.js`. It is written only  with older ECMAscript functions which IE9 supports, and current jQuery support IE9.


# INSTALL

## fract.js

fract.js is a javascript module. So you can use your favorate JS build environment, but the motivation of this library is avoiding complicated client-side build environment for your server-side apps, so I recommend to you using `<script type="module">` instead.

Because current modern web browsers support direct javascript module on HTML pages. You can use script tags for it but change the type from `text/javascript` to `module`. You can use `import` in the module blocks.

```html
<script type="module">
// fract.js exports following 3 functions.
import {send, sendForm, handleFractResponse} from '/js/fract.js';

// You can use the 3 functions from here...
</script>
```

## fract-jquery.js

You need jQuery for using `fract-jquery.js`. Import jQuery and fract-jquery.js at the HEAD block of HTML.

```html
<head>
<!-- import jQuery from CDN -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"   integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4="   crossorigin="anonymous"></script>
<!-- import fract-jquery.js from your server -->
<script type="text/javascript" src="/js/fract-jquery.js"></script>
</head>
<body>

</body>
```

`fract-jquery.js` exports a `Fract` object which contains functions fract.js exports. You can use the functions like below:

```html
<script type="text/javascript">
  // call Fract.send for accessing to a server-side handler.
  // The response from server-side is handled automatically.
  Fract.send('http://example.com/your_great_handler');
</script>
```

## Details

fract.js is a dependency-free library (except fract-jquery.js needs jQuery). You can use this library with any client libraries. No restrictions are against your Server-side environments other than a only one restriction, so that you can use this library with any programming language, frameworks or libraries. Just return a well-formed JSON data as a response of fract.js request.

### Client Side

Fract.js exports 3 javascript functions. You should call one of the functions at your element handlers.

#### handleFractResponse

You can use your favorate javascript library or functions for sending requests. The server-side request handlers for the requests will return well-formed JSON responses. You need handle the JSON with this `handleFractResponse` function.

For example, if you use Fetch API for sending a request:

```javascript
fetch(url, {method: 'GET', headers: {accept: 'application/json'}}).then(response => {
    response.JSON.then(data => {
        handleFractResponse(data);
    });
    return response;
})
```

`handleFractResponse` will update DOM automatically as defined by the response data.

#### send

Sending a request and handle the response is a most often usecase. `send` handles the both processes and automatically append a `Accept: application/json` header. So you can do same thing with the previous example as bellow:

```javascript
send(url, {method: 'GET'});
```

the first arg is url and the second is a option object (optional) of the `fetch` function of Fetch API (or a settings object of the `ajax` function of jQuery for fract-jquery.js).
`send` returns a Promise object (or a jqXHR object for fract-jquery.js). So you can chain promise handlers if you want like:

```javascript
send(url).then(response => console.debug(response.JSON));
```


#### sendForm

Sending a form as a javascript request is more complicated than just sending a data.
The `sendForm` function handles all basic operations under the hood. Your only task is passing a form element to the `sendForm` function.

```javascript
const form = document.querySelector('#myform');
sendForm(form);
```

`sendForm` will handle automatically the response and update DOM by the response data.
the first arg is a form element and the second is a option object (optional) of the `fetch` function of Fetch API (or a settings object of the `ajax` function of jQuery for fract-jquery.js).

NODE: It is recommended that &lt;form&gt; element have the `enctype="multipart/form-data"` attribute if you use fract-jquery.js.


### Server Side

The task you need to do at Server side is only make a response of JSON data formatted as following:

```json
{"preAction": "string",
 "components": {"componentPath": {"method": "'replace', 'prepend' or 'append'",
                                  "preAction": "string",
                                  "fractions": ["string", "string", "string"],
                                  "postAction": "string"}},
 "postAction": "string"}
```

But most of the keys of the JSON is optional. preAction and postAction are optional. The `fractions` vector can be a string if the number of elements of the vector is one, and the `fractions` key is optional if the `preAction` and `postAction` don't exist. Most miminum resopnse is like:

```json
{"components": {"componentPath": "string"}}
```

#### preAction

preAction is a javascript string which will be executed befor updating DOM. It is optional.
It will be wrapped by a function before be executed so that you can `return` a object.
If you return false, updating process will be aborted and updating DOM and running postActions never be executed.

You can supply `preAction` script at `components` level and `fractions` level.
preAction at `components` level will be executed before starting updating-process from the `components` key and can abort all `components` updating by returning false.
preAction at `fractions` level will be executed before starting updating-process from the `fractions` key and can abort all `fractions` updating by returning false, but the aborting never affect to other componentPath's update.

#### components

**components** is a object of the keys of componentPath and the values of updating info.

**componentPath** is a string called as fractId that matches a `data-fract-id` attribute in HTML or a string joined of them by ':' (ex: `parent-table:childItem1`). You can update multiple componentPaths at one reponse.

You can use the joined componentPath for matching a nested element when you can not choose only one element by a simple fractId.
For example:

```html
<div data-fract-id="table">
    <div data-fract-id="item">
        <span data-fract-id="userName"></span>
    </div>
</div>
<div data-fract-id="userName"></div>
```

For above HTML, a simple componentPath `userName` matches 2 elements (a `userName` element nested in table and a top-level element). If you want choose the nested `userName` element, you can use

* "table:item:userName"

or

* "table:userName"

The joined componentPath will be converted to a css expression like `*[data-fract-id="table"] *[data-fract-id="userName"]`, so that You can ommit a `item` element at middle of them for matching the nested `userName` element.

If matched elements are found, updating process of the componentPath will be started. No elements found, no process will be started for the componentPath.

**update-info** is a object with keys of `method`, `preAction`, `fractions` and `postAction`.
It is already described about `preAction` and `postAction`.

**method** is the way to update a element. It is optional and the default is `replace`.

**replace**: A matched elements will be replaced by the HTML in `fractions`. the `fractions` must be only one item. If the `fractions` is a vector and holds more than one item, An error will occur at client side and never be updated.

**prepend**: All items in `fractions` vector will be prepended before the element matched with fraction-id. The first item will be prepended before the element, second will be prepended before the first.

**append**: All items in `fractions` vector will be appended after the element matched with fraction-id. The first item will be appended after the element, second will be appended after the first.

`preaction`, `postAction` and `method` all are optional. If all of them don't exists and only `fractions` key exists, you can remove the object for a `componentPath` and directly write a fraction vector.

The vector for `fractions` key can be a string if the vector contains only one item.


#### postAction

postAction is a javascript string which will be executed after updating DOM. It is optional.


## License

Licensed under The MIT License (MIT)

Copyright © 2021 YANO Tsutomu

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
