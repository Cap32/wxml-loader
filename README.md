# wxml-loader

wxml loader for webpack

*Please note this [wxml](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/view/wxml/) is a markup language for [WeiXin App](https://mp.weixin.qq.com/debug/wxadoc/dev/)*


## Installation

```bash
yarn add -D wxml-loader
```

## Usage

```js
// add a loader
{
  test: /\.wxml$/,
  loader: 'wxml-loader'
}
```

##### Options

- `root` (String): Root path for request in `src`
- `publicPath` (String): Defaults to webpack [output.publicPath](https://webpack.js.org/configuration/output/#output-publicpath). If `output.publicPath` is `undefined`, default value is `/`
- `minimize` (Boolean): To minimize. Defaults to `false`.
- All [minimize](https://github.com/Swaagie/minimize#options) options are supported.

##### Notes

You may also need to use [file-loader](https://github.com/webpack-contrib/file-loader) if you want to extract some non-wxml files in `src` attribute.

For a complete guild to use `webpack` to develop Weixin App, please checkout my [wxapp-boilerplate](https://github.com/cantonjs/wxapp-boilerplate) repo.


## License

MIT
