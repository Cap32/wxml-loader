# wxml-loader

[![CircleCI](https://circleci.com/gh/Cap32/wxml-loader.svg?style=shield)](https://circleci.com/gh/Cap32/wxml-loader) [![Build Status](https://travis-ci.org/Cap32/wxml-loader.svg?branch=master)](https://travis-ci.org/Cap32/wxml-loader)

wxml loader for webpack

**Please note this [wxml](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/view/wxml/) is a markup language for [Wechat mini programs](https://mp.weixin.qq.com/debug/wxadoc/dev/)**


## Installation

```bash
yarn add -D wxml-loader
```

## Usage

You may also need to use [file-loader](https://github.com/webpack-contrib/file-loader) to extract files.

```js
{
  test: /\.wxml$/,
  include: /src/,
  use: [
    {
      loader: 'file-loader',
      options: {
        useRelativePath: true,
        name: '[name].[ext]',
      },
    },
    {
      loader: 'wxml-loader',
      options: {
        root: resolve('src'),
      },
    },
  ],
}
```

##### Options

- `root` (String): Root path for requiring sources
- `publicPath` (String): Defaults to webpack [output.publicPath](https://webpack.js.org/configuration/output/#output-publicpath)
- `transformContent(content, resource)` (Function): Transform content, should return a content string
- `transformUrl(url, resource)` (Function): Transform url, should return a url
- `minimize` (Boolean): To minimize. Defaults to `false`
- All [html-minifier](https://github.com/kangax/html-minifier#options-quick-reference) options are supported


## Known Issues

Currently `wxml-loader` could not resolve dynamic path, i.e. `<image src="./images/{{icon}}.png" />`. Please use `copy-webapck-plugin` to copy those resource to dist directory manually. See https://github.com/Cap32/wxml-loader/issues/1 for detail (Chinese).


## For Alipay mini programs

This loader is also compatible with [Alipay mini programs](https://mini.open.alipay.com/channel/miniIndex.htm). You just need to make sure using `test: /\.axml$/` instead of `test: /\.wxml$/` in webpack config.

If you're using [wxapp-webpack-plugin](https://github.com/Cap32/wxapp-webpack-plugin) and setting `Targets.Alipay` as webpack target, it will automatically set `transformContent()` and `transformUrl()` option by default, the `transformContent()` function will transform `wx:attr` attribute to `a:attr`, and the `transformUrl()` function will transform `.wxml` extension to `.axml` automatically. That means you could write mini programs once, and build both Wechat and Alipay mini programs.

###### Example

webpack.config.babel.js

```js
import WXAppWebpackPlugin, { Targets } from 'wxapp-webpack-plugin';
export default (env) => ({
  // ...other
  target: Targets[env.target || 'Wechat'],
  module: {
    rules: [
      // ...other,
      {
        test: /\.wxml$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: `[name].${env.target === 'Alipay' ? 'axml' : 'wxml'}`,
            },
          },
          'wxml-loader',
        ],
      },
    ],
  },
  plugin: [
    // ...other
    new WXAppWebpackPlugin(),
  ],
});
```


## Related Repo

For a complete guild to use `webpack` to develop `WeiXin App`, please checkout my [wxapp-boilerplate](https://github.com/cantonjs/wxapp-boilerplate) repo.


## License

MIT
