import * as child_process from 'child_process';
import * as node_cleanup from 'node-cleanup';

const PROCESSES: child_process.ChildProcess[] = [];
const SPAWN_READINESS_TIMEOUT = 10 * 1000;

export class ProcessError extends Error {
  stderr: string;
  stdout: string;
  command: (string|number)[];
  constructor(message: string, stderr: string, stdout: string, command: (string|number)[]) {
    super(message);
    this.stderr = stderr;
    this.stdout = stdout;
    this.command = command;
  }
}

export class ProcessNotReady extends ProcessError {}

export const spawn = (shell_command: string, args: (string|number)[], readiness_indicator?:string): Promise<child_process.ChildProcess> => new Promise((resolve, reject) => {
  let p = child_process.spawn(shell_command, args.map(String));
  PROCESSES.push(p);
  if(readiness_indicator) {
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', data => {
      stdout += data.toString();
      if(stdout.indexOf(readiness_indicator) !== -1) {
        resolve(p);
      }
    });
    p.stderr.on('data', data => {
      stderr += data.toString();
      if(stderr.indexOf(readiness_indicator) !== -1) {
        resolve(p);
      }
    });
    setTimeout(() => {
      reject(new ProcessNotReady(`Process did not become ready in ${SPAWN_READINESS_TIMEOUT} by outputting <${readiness_indicator}>`, stderr, stdout, [shell_command].concat(args as string[])));
      p.kill();
    }, SPAWN_READINESS_TIMEOUT);
  } else {
    resolve(p);
  }
});

export const exec = (shell_command: string): Promise<{stdout: string, stderr: string}> => new Promise((resolve, reject) => {
  let p: child_process.ChildProcess = child_process.exec(shell_command, (error, stdout, stderr) => error ? reject(error) : resolve({stdout, stderr}));
  PROCESSES.push(p);
});

export const killall = (signal: 'SIGINT'|'SIGKILL'|'SIGTERM'='SIGTERM') => {
  for(let p of PROCESSES) {
    if(!p.killed) {
      p.kill(signal);
    }
  }
};

node_cleanup((exit_code, signal) => {
  killall('SIGTERM');
  return undefined;
});
