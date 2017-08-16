# wxml-loader

[![CircleCI](https://circleci.com/gh/Cap32/wxml-loader.svg?style=shield)](https://circleci.com/gh/Cap32/wxml-loader) [![Build Status](https://travis-ci.org/Cap32/wxml-loader.svg?branch=master)](https://travis-ci.org/Cap32/wxml-loader)

wxml loader for webpack

**Please note this [wxml](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/view/wxml/) is a markup language for [WeiXin App](https://mp.weixin.qq.com/debug/wxadoc/dev/)**


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
- `minimize` (Boolean): To minimize. Defaults to `false`
- All [html-minifier](https://github.com/kangax/html-minifier#options-quick-reference) options are supported


## Known Issues

Currently `wxml-loader` could not resolve dynamic path, i.e. `<image src="./images/{{icon}}.png" />`. Please use `copy-webapck-plugin` to copy those resource to dist directory manually. See https://github.com/Cap32/wxml-loader/issues/1 for detail (Chinese).


## Related Repo

For a complete guild to use `webpack` to develop `WeiXin App`, please checkout my [wxapp-boilerplate](https://github.com/cantonjs/wxapp-boilerplate) repo.


## License

MIT
