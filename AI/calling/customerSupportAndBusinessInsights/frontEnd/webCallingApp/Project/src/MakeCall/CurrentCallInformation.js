import React, { useState, useEffect } from "react";
import { Features } from "@azure/communication-calling";
import { AzureLogger } from '@azure/logger';

const CurrentCallInformation = ({ sentResolution, call }) => {
    const [ovcFeature, setOvcFeature] = useState();
    const [optimalVideoCount, setOptimalVideoCount] = useState(1);

    useEffect(() => {
        try {
            setOvcFeature(call.feature(Features.OptimalVideoCount));
        } catch (error) {
            AzureLogger.log("Feature not implemented yet");
        }

        return () => {
            ovcFeature?.off('optimalVideoCountChanged', optimalVideoCountChanged);
        }
    }, []);

    useEffect(() => {
        ovcFeature?.on('optimalVideoCountChanged', optimalVideoCountChanged);
    }, [ovcFeature]);

    const optimalVideoCountChanged = () => {
        setOptimalVideoCount(ovcFeature.optimalVideoCount);
    };

    return (
        <div className="ms-Grid-col ms-lg6 text-right">
            <p>Call Id: {call.id}</p>
            {
                sentResolution && <p>Sent Resolution: {sentResolution}</p>
            }
            {
                ovcFeature && <p>Optimal Video Count: {optimalVideoCount}</p>
            }           
        </div>
    );
}

export default CurrentCallInformation;
