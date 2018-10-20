"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const node_cleanup = require("node-cleanup");
const PROCESSES = [];
const SPAWN_READINESS_TIMEOUT = 10 * 1000;
class ProcessError extends Error {
    constructor(message, stderr, stdout, command) {
        super(message);
        this.stderr = stderr;
        this.stdout = stdout;
        this.command = command;
    }
}
exports.ProcessError = ProcessError;
class ProcessNotReady extends ProcessError {
}
exports.ProcessNotReady = ProcessNotReady;
exports.spawn = (shell_command, args, readiness_indicator) => new Promise((resolve, reject) => {
    let p = child_process.spawn(shell_command, args.map(String));
    PROCESSES.push(p);
    if (readiness_indicator) {
        let stdout = '';
        let stderr = '';
        p.stdout.on('data', data => {
            stdout += data.toString();
            if (stdout.indexOf(readiness_indicator) !== -1) {
                resolve(p);
            }
        });
        p.stderr.on('data', data => {
            stderr += data.toString();
            if (stderr.indexOf(readiness_indicator) !== -1) {
                resolve(p);
            }
        });
        setTimeout(() => {
            reject(new ProcessNotReady(`Process did not become ready in ${SPAWN_READINESS_TIMEOUT} by outputting <${readiness_indicator}>`, stderr, stdout, [shell_command].concat(args)));
            p.kill();
        }, SPAWN_READINESS_TIMEOUT);
    }
    else {
        resolve(p);
    }
});
exports.exec = (shell_command) => new Promise((resolve, reject) => {
    let p = child_process.exec(shell_command, (error, stdout, stderr) => error ? reject(error) : resolve({ stdout, stderr }));
    PROCESSES.push(p);
});
exports.killall = (signal = 'SIGTERM') => {
    for (let p of PROCESSES) {
        if (!p.killed) {
            p.kill(signal);
        }
    }
};
node_cleanup((exit_code, signal) => {
    exports.killall('SIGTERM');
    return undefined;
});
//# sourceMappingURL=index.js.map