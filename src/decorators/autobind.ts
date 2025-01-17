///autobind decorator
export function autobind(_: any, _2: string, desc: PropertyDescriptor) {
	const originalMethod = desc.value;
	const adjDesc: PropertyDescriptor = {
		configurable: true,
		get() {
			const boundFn = originalMethod.bind(this);
			return boundFn;
		},
	};
	return adjDesc;
}
