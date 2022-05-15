export function jsonStringifyDOM (object: any) {
	let objectString = JSON.stringify(object, undefined, '\t');
	objectString = objectString.replace(/\n/g, '<br>');
	objectString = objectString.replace(/\t/g, '<span style="display: inline-block; width: 20px;"></span>');
	return objectString;
}