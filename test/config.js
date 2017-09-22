
import { resolve } from 'path';

export default (options = {}) => {
	const { target, ...other } = options;
	return {
		entry: resolve(__dirname, 'src', 'index.wxml'),
		output: {
			filename: 'index.js',
			publicPath: '/',
			path: resolve(__dirname, 'dist'),
		},
		target,
		module: {
			rules: [
				{
					test: /\.wxml$/,
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
								...other,
							},
						},
					],
				},
				{
					test: /\.gif$/,
					use: [
						{
							loader: 'file-loader',
							options: {
								name: '[name].[ext]',
							},
						},
					],
				},
			],
		},
		stats: 'verbose',
	};
};
