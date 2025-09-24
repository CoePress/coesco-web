/**
 * Feed Controls Mapping Utility
 * 
 * Maps controls levels to appropriate feed control types and determines
 * what frontend elements should be displayed based on the selection.
 */

export interface FeedControlsMapping {
    controls: string;
    feedType: string;
    showAllenBradleyFields: boolean;
    showSigma5Fields: boolean;
    showBasicControls: boolean;
    showAdvancedControls: boolean;
}

/**
 * Maps controls level to appropriate feed controls value
 */
export function mapControlsLevelToFeedControls(controlsLevel: string): FeedControlsMapping {
    switch (controlsLevel) {
        case "Allen Bradley Basic":
            return {
                controls: "Allen Bradley MPL Feed",
                feedType: "allen-bradley",
                showAllenBradleyFields: true,
                showSigma5Fields: false,
                showBasicControls: true,
                showAdvancedControls: false,
            };

        case "Allen Bradley Plus":
            return {
                controls: "Allen Bradley MPL Feed Plus",
                feedType: "allen-bradley",
                showAllenBradleyFields: true,
                showSigma5Fields: false,
                showBasicControls: false,
                showAdvancedControls: true,
            };

        case "SyncMaster":
            return {
                controls: "Sigma 5 Feed",
                feedType: "sigma-5",
                showAllenBradleyFields: false,
                showSigma5Fields: true,
                showBasicControls: true,
                showAdvancedControls: false,
            };

        case "SyncMaster Plus":
            return {
                controls: "Sigma 5 Feed Plus",
                feedType: "sigma-5",
                showAllenBradleyFields: false,
                showSigma5Fields: true,
                showBasicControls: false,
                showAdvancedControls: true,
            };

        case "IP Indexer Basic":
            return {
                controls: "IP Indexer Feed",
                feedType: "sigma-5",
                showAllenBradleyFields: false,
                showSigma5Fields: true,
                showBasicControls: true,
                showAdvancedControls: false,
            };

        case "IP Indexer Plus":
            return {
                controls: "IP Indexer Feed Plus",
                feedType: "sigma-5",
                showAllenBradleyFields: false,
                showSigma5Fields: true,
                showBasicControls: false,
                showAdvancedControls: true,
            };

        case "Fully Automatic":
            return {
                controls: "Fully Automatic Feed System",
                feedType: "sigma-5",
                showAllenBradleyFields: false,
                showSigma5Fields: true,
                showBasicControls: false,
                showAdvancedControls: true,
            };

        case "Mini-Drive System":
            return {
                controls: "Mini-Drive Feed",
                feedType: "sigma-5",
                showAllenBradleyFields: false,
                showSigma5Fields: true,
                showBasicControls: true,
                showAdvancedControls: false,
            };

        case "Relay Machine":
            return {
                controls: "Relay Feed System",
                feedType: "sigma-5",
                showAllenBradleyFields: false,
                showSigma5Fields: true,
                showBasicControls: true,
                showAdvancedControls: false,
            };

        default:
            // Default to SyncMaster/Sigma 5 Feed
            return {
                controls: "Sigma 5 Feed",
                feedType: "sigma-5",
                showAllenBradleyFields: false,
                showSigma5Fields: true,
                showBasicControls: true,
                showAdvancedControls: false,
            };
    }
}

/**
 * Gets the appropriate feed model options based on controls level
 */
export function getFeedModelOptionsForControlsLevel(controlsLevel: string): Array<{ value: string, label: string }> {
    const mapping = mapControlsLevelToFeedControls(controlsLevel);

    if (mapping.feedType === "allen-bradley") {
        return [
            { value: "CPRF-S1 MPL", label: "CPRF-S1 MPL" },
            { value: "CPRF-S2 MPL", label: "CPRF-S2 MPL" },
            { value: "CPRF-S3 MPL", label: "CPRF-S3 MPL" },
            { value: "CPRF-S3 MPM", label: "CPRF-S3 MPM" },
            { value: "CPRF-S4 MPL", label: "CPRF-S4 MPL" },
            { value: "CPRF-S5 MPL", label: "CPRF-S5 MPL" },
            { value: "CPRF-S6 MPL", label: "CPRF-S6 MPL" },
            { value: "CPRF-S7 MPL", label: "CPRF-S7 MPL" },
            { value: "CPRF-S8 MPL", label: "CPRF-S8 MPL" },
        ];
    } else {
        // Sigma 5 models
        return [
            { value: "CPRF-S1", label: "CPRF-S1" },
            { value: "CPRF-S2", label: "CPRF-S2" },
            { value: "CPRF-S3", label: "CPRF-S3" },
            { value: "CPRF-S4", label: "CPRF-S4" },
            { value: "CPRF-S5", label: "CPRF-S5" },
            { value: "CPRF-S6", label: "CPRF-S6" },
            { value: "CPRF-S7", label: "CPRF-S7" },
            { value: "CPRF-S8", label: "CPRF-S8" },
            { value: "CPRF-S8-500", label: "CPRF-S8-500" },
        ];
    }
}

/**
 * Determines if advanced torque calculations should be shown
 */
export function shouldShowAdvancedTorqueCalculations(controlsLevel: string): boolean {
    const mapping = mapControlsLevelToFeedControls(controlsLevel);
    return mapping.showAdvancedControls;
}

/**
 * Gets appropriate AMP options based on controls level
 */
export function getAmpOptionsForControlsLevel(controlsLevel: string): Array<{ value: string, label: string }> {
    const mapping = mapControlsLevelToFeedControls(controlsLevel);

    if (mapping.feedType === "allen-bradley") {
        return [
            { value: "AB 2094-BC07 + 2094-BM05 + 1394-SR36A", label: "AB 2094-BC07 + 2094-BM05 + 1394-SR36A" },
            { value: "AB 2094-BC04 + 2094-BM03 + 1394-SR36A", label: "AB 2094-BC04 + 2094-BM03 + 1394-SR36A" },
            { value: "AB 2094-BC02 + 2094-BM02 + 1394-SR36A", label: "AB 2094-BC02 + 2094-BM02 + 1394-SR36A" },
            { value: "AB 2094-BC01 + 2094-BM01 + 1394-SR36A", label: "AB 2094-BC01 + 2094-BM01 + 1394-SR36A" },
        ];
    } else {
        return [
            { value: "Sigma 5 Drive", label: "Sigma 5 Drive" },
            { value: "IP Indexer Drive", label: "IP Indexer Drive" },
            { value: "SyncMaster Drive", label: "SyncMaster Drive" },
            { value: "Custom Drive", label: "Custom Drive" },
        ];
    }
}

/**
 * Gets appropriate motor options based on controls level
 */
export function getMotorOptionsForControlsLevel(controlsLevel: string): Array<{ value: string, label: string }> {
    const mapping = mapControlsLevelToFeedControls(controlsLevel);

    if (mapping.feedType === "allen-bradley") {
        return [
            { value: "AB MPL-B680D", label: "AB MPL-B680D" },
            { value: "AB MPL-B540D", label: "AB MPL-B540D" },
            { value: "AB MPL-B430D", label: "AB MPL-B430D" },
            { value: "AB MPL-B330D", label: "AB MPL-B330D" },
            { value: "AB MPL-B220D", label: "AB MPL-B220D" },
            { value: "AB MPL-B140D", label: "AB MPL-B140D" },
        ];
    } else {
        return [
            { value: "Sigma 5 Servo Motor", label: "Sigma 5 Servo Motor" },
            { value: "IP Indexer Motor", label: "IP Indexer Motor" },
            { value: "SyncMaster Motor", label: "SyncMaster Motor" },
            { value: "Standard AC Motor", label: "Standard AC Motor" },
        ];
    }
}
