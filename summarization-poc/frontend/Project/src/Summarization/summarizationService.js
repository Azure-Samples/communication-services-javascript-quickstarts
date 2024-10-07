
const BASE_URL = "https://localhost:7051";

export const summarizationService = {

    startRecording: async (recordRequest) => {
        try {
            debugger;
            const response = await fetch(`${BASE_URL}/startRecording`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recordRequest),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log('POST request succeeded:', data);
            return data;
        } catch (error) {
            console.error('POST request failed:', error);
        }

    },

    stopRecording: async () => {
        try {
            const response = await fetch(`${BASE_URL}/stopRecording`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                throw new Error('Network response was not ok');
            }
        }
        catch (error) {
            console.error('POST request failed:', error);
        }
    },

    getSummary: async () => {
        // try {
        //     const response = await fetch(`${BASE_URL}/summarize`, {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         }
        //     });

        //     if (response.ok) {
        //         const data = await response.json();
        //         return data;
        //     } else {
        //         throw new Error('Network response was not ok');
        //     }


        // }
        // catch (error) {
        //     console.error('POST request failed:', error);
        // }

        const data = `this is test summary.`
        return data;
    },
}