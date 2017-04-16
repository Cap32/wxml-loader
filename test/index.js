
import loader from '../src';
import assert from 'assert';

describe('wxml-loader', () => {
	it('should convert requires', (done) => {
		const noop = () => {};
		const cb = (err, result) => {
			assert.equal(result, '');
			done();
		};
		loader.call(
			{
				async: () => cb,
				emitFile: noop,
				addDependency: noop,
				loadModule: noop,
				options: {
					context: 'src',
					output: {},
				},
				context: 'src',
				resourcePath: 'src',
			},
			'<view></view>',
		);
	});
});
