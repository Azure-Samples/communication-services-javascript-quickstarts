
const BASE_URL = "https://5btc4dst-7051.inc1.devtunnels.ms";

export const summarizationService = {

    startRecording: async (recordRequest) => {
        try {
            const response = await fetch(`${BASE_URL}/startRecording`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recordRequest),
            });

            console.log('POST request succeeded:', data);
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
        }
        catch (error) {
            console.error('POST request failed:', error);
        }
    },

    getSummary: async () => {
        try {
            const response = await fetch(`${BASE_URL}/summarize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            debugger;
            if (response) {
                const data = await response.json();
                return data;
            } else {
                throw new Error('Network response was not ok');
            }
        }
        catch (error) {
            console.error('POST request failed:', error);
        }

        // const data = `this is test summary.`
        // return data;
    },
}