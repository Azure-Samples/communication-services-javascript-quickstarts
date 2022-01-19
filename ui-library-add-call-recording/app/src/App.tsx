import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        An app to demonstrate API calls.
      </header>
      <DisplayApiResponse method="startRecording" />
      <DisplayApiResponse method="stopRecording" />

    </div>
  );
}

function DisplayApiResponse(props: { method: string }) {
  const { method } = props;
  const [data, setData] = useState('NO RESPONSE YET');
  useEffect(() => {
    (async function () {
      const text = await (await fetch(`/api/${method}`, { method: 'POST', body: JSON.stringify({ 'callId': 'dummy' }) })).text();
      console.log(method, text)
      setData(text);
    })();
  })
  return <h2 className="App-response">Response from {method}: {data}</h2>
}

export default App;
