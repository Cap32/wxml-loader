
import { resolve } from 'path';
import rimraf from 'rimraf';
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
	rimraf.sync(resolve(__dirname, 'src', 'index.wxml'));
	rimraf.sync(resolve(__dirname, 'dist'));
};

const mkdir = () => {
	clear();
};

const compile = (content, options = {}) => {
	writeWXML(content);
	return new Promise((resolve, reject) => {
		webpack(config(options), (err, stats) => {
			if (err || stats.hasErrors()) {
				reject(err || JSON.stringify(stats.toJson('errors-only')));
			}
			else { resolve(); }
		});
	});
};

describe('wxml-loader', () => {
	beforeEach(mkdir);
	afterEach(clear);

	test('should export file', async () => {
		const content = '<view></view>';
		await compile(content);
		const result = readFile();
		expect(result).toBe(content);
	});

	test('should minimize file', async () => {
		await compile('<view> </view>', { minimize: true });
		const result = readFile();
		expect(result).toBe('<view></view>');
	});

	test('should minimize work with self closing element', async () => {
		await compile('<input />', { minimize: true });
		const result = readFile();
		expect(result).toBe('<input/>');
	});

	test('should src work', async () => {
		await compile('<image src="./images/image.gif" />');
		const result = readFile();
		expect(result).toBe('<image src="/image.gif" />');
	});

	test('should dynamic src not work', async () => {
		await compile('<image src="./images/{{image}}.gif" />');
		const result = readFile();
		expect(result).toBe('<image src="./images/{{image}}.gif" />');
	});

	test('should Wechat target work', async () => {
		await compile('<view wx:for="{{items}}"> {{item}} </view>');
		const result = readFile();
		expect(result).toBe('<view wx:for="{{items}}"> {{item}} </view>');
	});

	test('should Alipay target work', async () => {
		await compile('<view wx:for="{{items}}"> {{item}} </view>', {
			target: function Alipay() {},
		});
		const result = readFile();
		expect(result).toBe('<view a:for="{{items}}"> {{item}} </view>');
	});

	test('should format() work', async () => {
		await compile('<view wx:for="{{items}}"> {{item}} </view>', {
			target: function Alipay() {},
			format: (content) => content.replace(/\bwx:/, '🦄:'),
		});
		const result = readFile();
		expect(result).toBe('<view 🦄:for="{{items}}"> {{item}} </view>');
	});
});
