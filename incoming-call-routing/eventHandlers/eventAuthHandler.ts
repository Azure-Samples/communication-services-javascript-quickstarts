
const secretKey = "secret";
const secretValue = "h3lloW0rld";

const getSecretQueryString = () => `${secretKey}=${encodeURIComponent(secretValue)}`;

const authorize = (query: string | undefined) => query === secretValue;

export {
    getSecretQueryString,
    authorize
};