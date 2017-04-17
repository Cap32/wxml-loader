
import loader from '../src';

const noop = () => {};

const execLoader = (content, ctx = {}) =>
	new Promise((resolve, reject) => {
		loader.call({
			emitFile: noop,
			addDependency: noop,
			options: {
				context: 'src',
				output: {},
			},
			context: 'src',
			resourcePath: 'src',
			loadModule: (req, cb) => cb(null,
				`module.exports = __webpack_public_path__ + ${JSON.stringify(req)};`
			),
			...ctx,
			async: () => (err, res) => {
				if (err) { reject(err); }
				else { resolve(res); }
			},
		}, content);
	})
;

test('should convert requires', async () => {
	const res = await execLoader('<view></view>');
	expect(res).toBe('<view></view>');
});

test('should require `src` attr', async () => {
	const res = await execLoader('<image src="./test.jpg"></image>');
	expect(res).toBe('<image src="./test.jpg"></image>');
});

test('should set `publicPath` to `src`', async () => {
	const publicPath = '/public';
	const res = await execLoader('<image src="./test.jpg"></image>', {
		options: {
			context: 'src',
			output: { publicPath },
		},
	});
	expect(res).toBe(`<image src="${publicPath}/test.jpg"></image>`);
});

test('should minimize', async () => {
	const res = await execLoader('<view> </view>', { minimize: true });
	expect(res).toBe('<view></view>');
});
