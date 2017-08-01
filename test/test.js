
import { resolve } from 'path';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import { readFileSync, writeFileSync } from 'fs';
import webpack from 'webpack';
import config from './config';

const readFile = () =>
	readFileSync(resolve(__dirname, 'dist', 'index.wxml'), 'utf8')
;

const writeWXML = (content) =>
	writeFileSync(resolve(__dirname, 'src', 'index.wxml'), content, 'utf8')
;

const clear = () => {
	rimraf.sync(resolve(__dirname, 'src'));
	rimraf.sync(resolve(__dirname, 'dist'));
};

const mkdir = () => {
	clear();
	mkdirp.sync(resolve(__dirname, 'src'));
};

const compile = (content, query) => {
	writeWXML(content);
	return new Promise((resolve, reject) => {
		webpack(config(query), (err) => {
			if (err) { reject(err); }
			else { resolve(); }
		});
	});
};

describe('wxml-loader', () => {
	beforeEach(mkdir);
	afterEach(clear);

	it('should export file', async () => {
		const content = '<view></view>';
		await compile(content);
		const result = readFile();
		expect(result).toBe(content);
	});

	it('should minimize file', async () => {
		await compile('<view> </view>', { minimize: true });
		const result = readFile();
		expect(result).toBe('<view></view>');
	});

	it('should minimize work with self closing element', async () => {
		await compile('<input />', { minimize: true });
		const result = readFile();
		expect(result).toBe('<input/>');
	});
});
