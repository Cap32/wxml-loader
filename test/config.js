
import { resolve } from 'path';

export default (query = {}) => ({
	entry: resolve(__dirname, 'src', 'index.wxml'),
	output: {
		filename: 'index.js',
		publicPath: '/',
		path: resolve(__dirname, 'dist'),
	},
	module: {
		rules: [
			{
				test: /\.wxml$/,
				include: /test\/src/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
						},
					},
					{
						loader: './src',
						options: {
							root: resolve(__dirname, 'src'),
							...query,
						},
					},
				],
			},
		],
	},
});
