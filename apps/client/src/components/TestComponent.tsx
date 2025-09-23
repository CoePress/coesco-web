import { useState } from "react";

export const TestComponent = () => {
    console.log("TestComponent rendering - React available:", !!useState);

    try {
        const [test, setTest] = useState("Hello World");
        console.log("useState working:", test);

        return (
            <div>
                <h1>React Hooks Test</h1>
                <p>State value: {test}</p>
                <button onClick={() => setTest("Updated!")}>
                    Update State
                </button>
            </div>
        );
    } catch (error) {
        console.error("Error in TestComponent:", error);
        return <div>Error: {String(error)}</div>;
    }
};
