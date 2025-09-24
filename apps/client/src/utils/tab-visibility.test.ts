/**
 * Test cases for tab visibility logic
 * Run in browser console to verify the logic matches the examples
 */

// Mock performance data for the examples
const example1 = {
    feed: {
        feed: {
            application: "pressFeed",
            pullThru: { isPullThru: "No" }
        }
    },
    common: {
        equipment: {
            feed: {
                lineType: "Conventional",
                controlsLevel: "SyncMaster",
                typeOfLine: "conventional"
            }
        }
    },
    materialSpecs: {
        feed: {
            controls: "sigma 5 feed"
        }
    },
    rollStrBackbend: {
        straightener: {
            rolls: {
                typeOfRoll: "7 Roll Str Backbend"
            }
        }
    }
};

const example2 = {
    feed: {
        feed: {
            application: "standalone",
            pullThru: { isPullThru: "No" }
        }
    },
    common: {
        equipment: {
            feed: {
                lineType: "Feed",
                controlsLevel: "Relay Machine",
                typeOfLine: "feed"
            }
        }
    },
    materialSpecs: {
        feed: {
            controls: "sigma 5 feed"
        }
    },
    rollStrBackbend: {
        straightener: {
            rolls: {
                typeOfRoll: "7 Roll Str Backbend"
            }
        }
    }
};

const example3 = {
    feed: {
        feed: {
            application: "cutToLength",
            pullThru: { isPullThru: "No" }
        }
    },
    common: {
        equipment: {
            feed: {
                lineType: "Conventional",
                controlsLevel: "SyncMaster Plus",
                typeOfLine: "conventional ctl"
            }
        }
    },
    materialSpecs: {
        feed: {
            controls: "sigma 5 feed"
        }
    },
    rollStrBackbend: {
        straightener: {
            rolls: {
                typeOfRoll: "11 Roll Str Backbend"
            }
        }
    }
};

const example4 = {
    feed: {
        feed: {
            application: "pressFeed",
            pullThru: { isPullThru: "Yes" }
        }
    },
    common: {
        equipment: {
            feed: {
                lineType: "Compact",
                controlsLevel: "SyncMaster Plus",
                typeOfLine: "pull through compact"
            }
        }
    },
    materialSpecs: {
        feed: {
            controls: "sigma 5 feed with pull through"
        }
    },
    rollStrBackbend: {
        straightener: {
            rolls: {
                typeOfRoll: "7 Roll Str Backbend"
            }
        }
    }
};

// Expected results
const expectedResults = {
    example1: ["rfq", "material-specs", "summary-report", "tddbhd", "str-utility", "roll-str-backbend", "feed"],
    example2: ["rfq", "material-specs", "summary-report", "feed"],
    example3: ["rfq", "material-specs", "summary-report", "tddbhd", "str-utility", "roll-str-backbend", "feed"],
    example4: ["rfq", "material-specs", "summary-report", "tddbhd", "reel-drive", "feed"]
};

console.log("Tab Visibility Test Cases");
console.log("========================");

// If running in the app context where getVisibleTabs is available:
/*
try {
    console.log("Example 1 tabs:", getVisibleTabs(example1).map(t => t.value));
    console.log("Expected:     ", expectedResults.example1);
    console.log("");
    
    console.log("Example 2 tabs:", getVisibleTabs(example2).map(t => t.value));
    console.log("Expected:     ", expectedResults.example2);
    console.log("");
    
    console.log("Example 3 tabs:", getVisibleTabs(example3).map(t => t.value));
    console.log("Expected:     ", expectedResults.example3);
    console.log("");
    
    console.log("Example 4 tabs:", getVisibleTabs(example4).map(t => t.value));
    console.log("Expected:     ", expectedResults.example4);
} catch (error) {
    console.error("Test failed:", error);
}
*/

export { example1, example2, example3, example4, expectedResults };
