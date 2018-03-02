import { resolve } from 'path';

const srcDir = resolve(__dirname, 'src');

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
								useRelativePath: true,
								context: srcDir,
							},
						},
						{
							loader: './src',
							options: {
								root: srcDir,
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
								useRelativePath: true,
								context: srcDir,
							},
						},
					],
				},
			],
		},
		stats: 'verbose',
	};
};
