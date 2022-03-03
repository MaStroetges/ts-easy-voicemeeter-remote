export class VoiceMeeterLoginError extends Error {
    public returnValue: number | string;
    constructor(msg: string, returnValue: number | string) {
        super(msg);

        this.returnValue = returnValue;
        Object.setPrototypeOf(this, VoiceMeeterLoginError.prototype);
    }
}
