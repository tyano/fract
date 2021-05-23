# Fract JS

サーバーサイドからの動的なDOM更新をサポートするための、小さく、シンプルな、Javascriptライブラリです。

## 短い解説

あなたのサーバーから、特定のフォーマットに沿ったJSONを返却するだけで、クライアントサイドのHTMLのDOMを更新することができます。
クライアント側で行うことは、動的に更新したい要素に対し data-fract-id という属性を設定することと、以下のJavascript関数の**いずれか**を使うことだけです。

* サーバーからのレスポンスを、fract.jsの`handleFractResponse`関数を使って処理する
* リクエストを、fract.jsの`send`関数を使って送信する。この関数は、レスポンスを自動的に処理します。
* HTML Formを、fract.jsの`sendForm`関数を使って送信する。この関数は、レスポンスを自動的に処理します。

サーバーサイドのハンドラは、下記のような、決まったフォーマットのJSONを返す必要があります。

```json
{"components": {"flash-message": "<p data-fract-id='flash'>An error occurred!!</p>"}}
```

fract.jsは、レスポンス内の `components` オブジェクトのキーと合致するような、`data-fract-id`属性をもった要素をHTML内で探し、それらを `components` オブジェクトの値に設定されたHTML文字列で置き換えます。ただそれだけです。

## モチベーション

JavascriptによるSingle Page Application(SPA)は日に日にポピュラーとなってきています。しかし、すべてのユースケースがSPAを必要とするわけではありません。仕事で、小さなウェブ・アプリケーションを作る必要が出てきたが、SPAを使うほどではないし、クライアント側とサーバー側の両方に複雑なビルド環境を用意したくなく、ただ単純に小さなサーバーサイド・アプリだけで済ませたい、ということもあるでしょう。このライブラリは、そういう時に使えます。

クライアント側でのあなたのタスクは、Fract.jsから関数をimportして、サーバー側にデータを送信したり、受信するときにそれら関数を使うだけです。その他のことは、全部サーバー側で行うことができます。

サーバー側のプログラムに集中しつつ、なおかつ、特定の形のJSONレスポンスをサーバーから返すだけで、簡単に、動的にクライアント側のDOMを更新することができます。


##　なぜJSファイルが２つあるのか

このプロジェクトの中心となるスクリプトは、`fract.js`の方です。このスクリプトは、`let`や`const`, Fetch APIといった、新しいECMAScriptの言語機能を利用しているため、モダンなウェブ・ブラウザでのみ動作します。

しかし、ビジネス上の条件が、ユーザーに最新のブラウザの使用を許さないこともあるでしょう。その場合は、`fract-jquery.js`を代わりに使えます。こちらは、IE9がサポートしている、より古いECMAscript言語機能だけを使って書かれています。かつ、jQueryはIE9以降をサポートしています。


# INSTALL

## fract.js

fract.jsは、Javascriptのmoduleですので、お気に入りのJSビルド環境に組み込むことができます。しかし、このライブラリの作成意図としては、サーバーアプリを作るにあたり、複雑なクライアント側ビルド環境の構築を避けたい、ということもあります。そのため、`<script type="module">` を使うことをお勧めします。

現在のモダンなウェブ・ブラウザでは、HTMLページ内に直接Javascript moduleを定義することができます。scriptタグを使いますが、そのtypeをいつもの「text/javascript」から「module」に変更します。こうすることで、そのmoduleブロックの中で、 `import` を使えるようになります。

```html
<script type="module">
// fract.js は３つの関数をexportしています。
import {send, sendForm, handleFractResponse} from '/js/fract.js';

// ここ以降、上記でimportした３つの関数を使うことができます。
</script>
```

## fract-jquery.js

`fract-jquery.js` を使う場合は、jQueryが必要です。jQueryとfract-jquery.jsとをHTMLのHEADブロック内でロードしてください。

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

`fract-jquery.js` は「Fract」というオブジェクトをエクスポートしており、このオブジェクト内に、fract.jsがエクスポートしているのと同じ関数を持っています。以下のように、Fractオブジェクト経由で、これらの関数を呼ぶことができます。

```html
<script type="text/javascript">
  // サーバーのハンドラにアクセスするために、Fract.send関数を呼びます。
  // サーバーからのレスポンスは、自動的に処理されます。
  Fract.send('http://example.com/your_great_handler');
</script>
```

## 詳細

fract.jsは、他のライブラリに依存していません（ただし、fract-jquery.jsがjQueryを必要する点だけが例外です）。そのため、このライブラリを、他のどのようなライブラリとも組み合わせて使うことができます。サーバー側環境についても、１つを除いて、一切の制約はありません。そのため、どのような言語、どのようなフレームワーク、どのようなライブラリとでも使うことができます。サーバー側は、fract.jsからのリクエストに対して、ただ特定の形をしたJSONを返すだけでいいのです。


### クライアント側

fract.jsは３つのJavascript関数をエクスポートしています。あなたは、要素のイベントハンドラで、これらのうちいずれかを使う必要があります。

#### handleFractResponse

リクエストを送信するのには、どのようなJavascriptライブラリを利用してもかまいません。サーバ側のリクエストハンドラは、特定のフォーマットのJSONを返してきます。そのJSONを、このhandleFractResponse関数に渡してください。

例えば、リクエストの送信にFetch APIを使う場合は、以下のようになるでしょう。

```javascript
fetch(url, {method: 'GET', headers: {accept: 'application/json'}}).then(response => {
    response.JSON.then(data => {
        handleFractResponse(data);
    });
    return response;
})
```

`handleFractResponse`は、レスポンスデータに定義されている通りに、自動的にDOMを更新してくれます。

#### send

リクエストを送信し、そのレスポンスを処理する、という流れは、かなり頻繁に行う作業です。`send`関数は、その両方を処理し、なおかつ、送信データに自動的に `Accept: application/json` ヘッダを付与します。`send` を使えば、前述の例を、以下のように書くことができます。

```javascript
send(url, {method: 'GET'});
```

最初の引数はURLであり、２つ目はJavascriptのFetch APIにある `fetch` 関数に渡す、optionオブジェクトです（optionは省略可能です。fract-jquery.jsの場合は、jQueryの `ajax` 関数に渡すsettingsオブジェクトになります）。
`send` はPromiseオブジェクト（または、fract-jqueyr.jsの場合は、jqXHRオブジェクト）を返すので、以下のように、Promiseハンドラを数珠繋ぎにすることもできます。

```javascript
send(url).then(response => console.debug(response.JSON));
```


#### sendForm

HTMLフォームをJavascriptで送信するのは、ただデータを送信するのに比べると、もう少し複雑です。
この`sendForm`関数は、そのややこしい操作を裏側で行ってくれます。ただ`sendForm`関数にフォーム要素を渡すだけでかまいません。

```javascript
const form = document.querySelector('#myform');
sendForm(form);
```

`sendForm`はレスポンスを自動的に処理し、レスポンスに定義された通りに、DOMを更新します。
最初の引数はフォーム要素で、２つ目はJavascriptのFetch APIにある `fetch` 関数に渡す、optionオブジェクトです（optionは省略可能です。fract-jquery.jsの場合は、jQueryの `ajax` 関数に渡すsettingsオブジェクトになります）。

注意： fract-jquery.jsを使う場合は、&lt;form&gt;要素には `enctype="multipart/form-data"` 属性をつけることをお勧めします。


### サーバー側

サーバー側で行うべきことは、ただ特定のフォーマットに従ったJSONレスポンスを作ることだけです。

```json
{"preAction": "string",
 "components": {"componentPath": {"method": "'replace', 'prepend' or 'append'",
                                  "preAction": "string",
                                  "fractions": ["string", "string", "string"],
                                  "postAction": "string"}},
 "postAction": "string"}
```

このJSONのキーの大部分は、必須ではありません。`preAction`と`postAction`は省略可能です。`fractions`の配列は、その項目が１つだけの場合は、文字列だけにすることができます。`fractions`キー自体も、もし`preAction`と`postAction`の両方が省略されている場合は、省略することができます。そのため、最小のJSONは以下のようになるでしょう。

```json
{"components": {"componentPath": "string"}}
```

#### preAction

preActionは、DOMを更新する前に実行されるJavascriptコードです。省略可能です。
このJavascriptコードは、実行前に関数にラップされた上で、実行されますので、関数内のように`return`を使ってオブジェクトを返すことができます。
もし `false` を戻した場合は、後続プロセスはキャンセルされ、DOMの更新及び`postAction`は実行されません。

`preAction`スクリプトは、`components`レベルと`fractions`レベルのどちらにも指定できます。
`components`レベルのpreActionは、`components`キーのための更新処理の前に実行され、`false`が返ってきた場合は、それ以降のすべての`components`キーの処理をキャンセルします。
`fractions`レベルのpreActionは、`fractions`キーのための更新処理の前に実行され、`false`が返ってきた場合は、`fractions`キーの更新をキャンセルしますが、他のcomponentPathの処理には影響しません。

#### components

**components**は、キーとして`componentPath`を、値として更新情報を持つオブジェクトです。

#### componentPath

`componentPath`はHTML内の`data-fract-id`属性と合致する、fractIdと呼ぶ文字列か、あるいはそれをコロン(:)でつなげたものです（例えば `parent-table:childItem1`）。１つのレスポンスで、複数のcomponentPathを更新することができます。

単純なfractIdで一つの要素にマッチできない場合は、このコロンで接続されたcomponentPathを使うことができます。例えば:

```html
<div data-fract-id="table">
    <div data-fract-id="item">
        <span data-fract-id="userName"></span>
    </div>
</div>
<div data-fract-id="userName"></div>
```

上記のHTMLでは、単純なcomponentPathである`userName`では、２つの要素にマッチしてしまいます（`table`の内側にある`userName`要素と、トップレベルのもの）。内側の`userName`要素だけを選択したい場合は、以下のいずれかの方法が使えます。

* "table:item:userName"

もしくは

* "table:userName"

コロンで接続されたcomponentPathは、CSS式の `*[data-fract-id="table"] *[data-fract-id="userName"]` に変換されます。そのため、`table`の下にある`item`要素を省略しても、ネストされた`userName`要素にちゃんとマッチします。

`componentPath`にマッチする要素が見つかった場合は、その`componentPath`に対する更新プロセスが開始されます。要素が見つからなかった場合は、何も実行されません。

**update-info** はキーとして `method`, `preAction`, `fractions` 及び `postAction` を持つオブジェクトです。
`preAction` と `postAction` については別項で説明しています。

**method** は、要素を更新する方法を指定するキーです。省略可能であり、デフォルトは `replace` です。指定できるキーは以下の３つです。

**replace**: マッチした要素は、`fractions`キーに指定したHTMLで置き換えられます。`fractions`キーに指定された配列は、項目数１である必要があります。もし１つ以上の項目が含まれていたら、クライアント側でエラーが発生し、要素は更新されません。

**prepend**: `fractions`の中の全項目が、`componentPath`にマッチした要素の前に挿入されます。まず最初の項目がマッチした要素の前に挿入され、次の項目が最初の項目の前に挿入されます。

**append**: `fractions`の中の全項目が、`componentPath`にマッチした要素のあとに追加されます。まず最初の項目がマッチした要素のあとに追加され、次の項目が最初の項目のあとに追加されます。

`preAction`と`postAction`、`method`は省略可能です。これらがすべて省略され、`fractions`キーだけが残った場合は、`componentPath`キーの値としてのオブジェクトも省略し、`componentPath`に対して直接、`fractions`の配列を指定することができます。

さらに、`fractions`キーへの配列の項目数が１つの場合は、配列を省略し、文字列を直接指定することができます。


#### postAction

`postAction`は、DOMを更新した後に実行されるJavascriptコードです。省略可能です。


## License

Licensed under The MIT License (MIT)

Copyright © 2021 YANO Tsutomu

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
