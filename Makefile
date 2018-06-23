.PHONY: test
publish:
	npm run build
	# 确保 当前源 在npm 上
	npm config set registry https://registry.npmjs.org/
	npm version minor
	git push
	git push --tags
	npm publish
