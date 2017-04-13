
import { relative, resolve } from 'path';
import { Parser } from 'htmlparser2';
import { isUrlRequest } from 'loader-utils';

export default function (content) {
	this.cacheable && this.cacheable();
	if (!this.emitFile) {
		throw new Error('emitFile is required from module system');
	}

	const callback = this.async();
	const {
		options: { context },
		context: resourceDir,
		resourcePath,
		_module,
	} = this;
	const hasIssuer = _module && _module.issuer;
	const issuerContext = hasIssuer && _module.issuer.context || context;

	const emit = (dep) => {
		const filename = relative(issuerContext, dep);
		this.emitFile(filename, require('fs').readFileSync(dep, 'utf8'));
	};

	const logValue = (name, val) => {
		if (name !== 'src' || !isUrlRequest(val)) { return; }

		const dep = resolve(resourceDir, val);
		this.addDependency(dep);
		this.loadModule(dep, () => {});
		emit(dep);
	};

	const parser = new Parser({
		onattribute: logValue,
		onend: () => {
			emit(resourcePath);
			callback(null, '');
		}
	});
	parser.write(content);
	parser.end();
}
