export class VoiceMeeterError extends Error {
    constructor(msg: string, returnValue?: any) {
        super(`${msg} ${returnValue ? `: ${returnValue}`: ''}`);
        Object.setPrototypeOf(this, VoiceMeeterError.prototype);
    }
}

export class VoiceMeeterLoginError extends VoiceMeeterError {
    public returnValue: number | string;
    constructor(val: number | string) {
        super(VoiceMeeterLoginError.getMessage(val), val);
        Object.setPrototypeOf(this, VoiceMeeterLoginError.prototype);

        this.returnValue = val;
    }

    private static getMessage(val: string|number) {
        if (val === 1) {
            return "OK but VoiceMeeter Application not launched"
        }
        else if (val === -1) {
            return "Cannot get client (unexpected)"
        }
        else if (val === -2) {
            return "Unexpected login (logout was expected before)"
        }
        return "Unexpected error logging in to VoiceMeeter";
    }
}

export class VoiceMeeterInitializationError extends VoiceMeeterError {
    constructor() {
        super("VoiceMeeter object has not been initialized");
        Object.setPrototypeOf(this, VoiceMeeterInitializationError.prototype);
    }
}

export class VoiceMeeterConnectionError extends VoiceMeeterError {
    constructor() {
        super("VoiceMeeter object has not connected to VoiceMeeter application");
        Object.setPrototypeOf(this, VoiceMeeterConnectionError.prototype);
    }
}

export class VoiceMeeterGetTypeError extends VoiceMeeterError {
    constructor(val: string | number) {
        super(VoiceMeeterGetTypeError.getMessage(val), val);
        Object.setPrototypeOf(this, VoiceMeeterGetTypeError.prototype);
    }

    private static getMessage(val: string|number) {
        if (val === -1) {
            return "Cannot get client (unexpected)"
        }
        else if (val === -2) {
            return "No server"
        }
        return "Unexpected error getting VoiceMeeter type";
    }
}

export class VoiceMeeterGetVersionError extends VoiceMeeterError {
    constructor(val: string | number) {
        super(VoiceMeeterGetVersionError.getMessage(val), val);
        Object.setPrototypeOf(this, VoiceMeeterGetVersionError.prototype);
    }

    private static getMessage(val: string|number) {
        if (val === -1) {
            return "Cannot get client (unexpected)"
        }
        else if (val === -2) {
            return "No server"
        }
        return "Unexpected error getting VoiceMeeter Version";
    }
}

export class VoiceMeeterRunError extends VoiceMeeterError {
    constructor(val: string | number) {
        super(VoiceMeeterRunError.getMessage(val), val);
        Object.setPrototypeOf(this, VoiceMeeterRunError.prototype);
    }

    private static getMessage(val: string|number) {
        if (val === -1) {
            return "Not installed (UninstallString not found in registry)"
        }
        else if (val === -2) {
            return "Unknown vType number"
        }
        return "Unexpected error running VoiceMeeter";
    }
}

export class VoiceMeeterMidiError extends VoiceMeeterError {
    constructor(val: string | number) {
        super(VoiceMeeterMidiError.getMessage(val), val);
        Object.setPrototypeOf(this, VoiceMeeterMidiError.prototype);
    }

    private static getMessage(val: string|number) {
        if (val === -1) {
            // This error is not particularly useful, but is a possible return value from the dll
            return "Get Midi error"
        }
        else if (val === -2) {
            return "No server"
        }
        else if (val === -5) {
            return "No MIDI data"
        }
        else if (val === -6) {
            // Seemingly a duplicate but another possible return value
            return "No MIDI data"
        }
        return "Unexpected error getting MIDI data";
    }
}

export class VoiceMeeterLevelError extends VoiceMeeterError {
    constructor(val: string | number) {
        super(VoiceMeeterLevelError.getMessage(val), val);
        Object.setPrototypeOf(this, VoiceMeeterLevelError.prototype);
    }

    private static getMessage(val: string|number) {
        if (val === -1) {
            // This error is not particularly useful, but is a possible return value from the dll
            return "Get Level error"
        }
        else if (val === -2) {
            return "No server"
        }
        else if (val === -3) {
            return "No level available"
        }
        else if (val === -4) {
            return "Out of range"
        }
        return "Unexpected error getting level";
    }
}

export class VoiceMeeterMacroButtonError extends VoiceMeeterError {
    constructor(val: string | number) {
        super(VoiceMeeterMacroButtonError.getMessage(val), val);
        Object.setPrototypeOf(this, VoiceMeeterMacroButtonError.prototype);
    }

    private static getMessage(val: string|number) {
        if (val === -1) {
            // This error is not particularly useful, but is a possible return value from the dll
            return "Macro button error"
        }
        else if (val === -2) {
            return "No server"
        }
        else if (val === -3) {
            return "Unknown parameter"
        }
        else if (val === -5) {
            return "Structure mismatch"
        }
        return "Unexpected macro button error";
    }
}

export class VoiceMeeterDirtyError extends VoiceMeeterError {
    constructor(val: string | number) {
        super(VoiceMeeterDirtyError.getMessage(val), val);
        Object.setPrototypeOf(this, VoiceMeeterDirtyError.prototype);
    }

    private static getMessage(val: string|number) {
        if (val === -1) {
            // This error is not particularly useful, but is a possible return value from the dll
            return "VoiceMeeter dirty check error"
        }
        else if (val === -2) {
            return "No server"
        }
        return "Unexpected dirty check error";
    }
}

export class VoiceMeeterGetParametersError extends VoiceMeeterError {
    public parameterName: string
    constructor(val: string | number, parameterName: string) {
        super(VoiceMeeterGetParametersError.getMessage(val), val);
        Object.setPrototypeOf(this, VoiceMeeterGetParametersError.prototype);
        this.parameterName = parameterName;
    }

    private static getMessage(val: string|number) {
        if (val === -1) {
            // This error is not particularly useful, but is a possible return value from the dll
            return "Get parameter error"
        }
        else if (val === -2) {
            return "No server"
        }
        else if (val === -3) {
            return "Unknown parameter"
        }
        else if (val === -5) {
            return "Structure mismatch"
        }
        return "Unexpected error getting parameters";
    }
}

export class VoiceMeeterSetParametersError extends VoiceMeeterError {
    public parameterName: string
    constructor(val: string | number, parameterName: string) {
        super(VoiceMeeterSetParametersError.getMessage(val), val);
        Object.setPrototypeOf(this, VoiceMeeterSetParametersError.prototype);
        this.parameterName = parameterName;
    }

    private static getMessage(val: string|number) {
        if (val > 0) {

        }
        else if (val === -1) {
            // This error is not particularly useful, but is a possible return value from the dll
            return "Parameter set error"
        }
        else if (val === -2) {
            return "No server"
        }
        else if (val === -3) {
            // Not sure why these 
            return "Unexpected error"
        }
        else if (val === -4) {
            return "Unexpected error"
        }
        return "Unexpected error getting parameters";
    }
}
