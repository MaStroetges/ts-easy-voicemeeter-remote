export class VoiceMeeterLoginError extends Error {
    public returnValue: number | string;
    constructor(msg: string, returnValue: number | string) {
        super(msg);
        Object.setPrototypeOf(this, VoiceMeeterLoginError.prototype);

        this.returnValue = returnValue;
    }
}
