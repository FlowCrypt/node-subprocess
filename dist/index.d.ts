/// <reference types="node" />
import * as child_process from 'child_process';
export declare class ProcessError extends Error {
    stderr: string;
    stdout: string;
    command: (string | number)[];
    constructor(message: string, stderr: string, stdout: string, command: (string | number)[]);
}
export declare class ProcessNotReady extends ProcessError {
}
export declare const spawn: (shell_command: string, args: (string | number)[], readiness_indicator?: string | undefined) => Promise<child_process.ChildProcess>;
export declare const exec: (shell_command: string) => Promise<{
    stdout: string;
    stderr: string;
}>;
export declare const killall: (signal?: "SIGINT" | "SIGKILL" | "SIGTERM") => void;
