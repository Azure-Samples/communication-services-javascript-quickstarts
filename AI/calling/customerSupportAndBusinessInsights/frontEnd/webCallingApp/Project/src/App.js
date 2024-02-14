import React, { useState } from 'react';
import './App.css';
import MakeCall from './MakeCall/MakeCall'
import { initializeIcons } from '@uifabric/icons';
import { ToastContainer } from 'react-toastify';

initializeIcons();

function App() {
  let [users, setUsers] = useState([<MakeCall/>]);

  function VWebSdkVersion() {
    return require('../package.json').dependencies['@azure/communication-calling'];
  }

  return (
    <div className="App">
      <ToastContainer />
      <div className="header ms-Grid">
        <div className="ms-Grid-row">
          <div className="ms-Grid-col ms-lg6 inline-flex align-items-center">
            <div className="inline-block">
                <img onClick={() => {setUsers([...users, <MakeCall/>]) }} className="nav-bar-icon" src="./assets/images/acsIcon.png"></img>
            </div>
            <h2 className="inline-block">
              Azure Communication Services - Calling SDK for Javascript - { VWebSdkVersion() }
            </h2>
          </div>
          <div className="ms-Grid-col ms-lg6">
            <div className="sdk-docs-header">
              <a className="sdk-docs-link" target="_blank" href="https://learn.microsoft.com/en-gb/azure/communication-services/how-tos/calling-sdk/manage-calls?pivots=platform-web">Documentation</a>
            </div>
            <div className="sdk-docs-header">
              <a className="sdk-docs-link" href="https://docs.microsoft.com/en-us/javascript/api/azure-communication-services/@azure/communication-calling/?view=azure-communication-services-js">API Reference Documentation</a>
            </div>
          </div>
        </div>
      </div>
      <div id="user-div">
        {users}
      </div>
    </div>
  );
}

export default App;
