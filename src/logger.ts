export enum LoggerLevel {
	NONE = 0,
	MINIMAL = 1,
	COMPLETE = 2,
	DEBUG = 3,
}

function getInitialLoggerLevel(): LoggerLevel {
	const treatedStr = (process.env['LOGGER_LEVEL'] || '').trim().toLowerCase();

	const LoggerLevelsKeys = Object.keys(LoggerLevel).filter(v => isNaN(Number(v)));
	const level = LoggerLevelsKeys.find(level => level.toLowerCase() === treatedStr);
	if (level) {
		return LoggerLevel[level as any] as any;
	} else {
		return LoggerLevel.MINIMAL;
	}
}

export const loggerLevel: LoggerLevel = getInitialLoggerLevel();

if (loggerLevel >= LoggerLevel.COMPLETE) {
	console.log('Starting Logger level with', LoggerLevel[loggerLevel]);
}

export function log(message: string, minimumLoggerLevel: LoggerLevel) {
	if (loggerLevel >= minimumLoggerLevel) {
		console.log(message);
	}
}
