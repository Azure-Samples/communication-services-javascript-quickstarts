import React, { useEffect, useState } from "react";
import { Features, CallKind } from '@azure/communication-calling';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';
import { Icon } from '@fluentui/react/lib/Icon';
import CommunicationAI from "./CommunicationAI/CommunicationAI";

// CallCaption react function component
const CallCaption = ({ call }) => {
    const [captionsFeature, setCaptionsFeature] = useState(call.feature(Features.Captions));
    const [captions, setCaptions] = useState(captionsFeature.captions);
    const [currentSpokenLanguage, setCurrentSpokenLanguage] = useState(captions.activeSpokenLanguage);
    const [currentCaptionLanguage, setCurrentCaptionLanguage] = useState(captions.activeCaptionLanguage);

    const [captionHistory, setCaptionHistory] = useState([]);
    const [communicationAI, setCommunicationAI] = useState(false);
    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);

    let localMri = (call.kind === CallKind.Call) ? window.identityMri.communicationUserId : window.identityMri.rawId;

    useEffect(() => {
        try {
            window.captionHistory = [];
            startCaptions(captions);
        }
        catch (e) {
            console.log("Captions not configured for this release version")
        }

        return () => {
            // cleanup
            captions.off('CaptionsActiveChanged', captionsActiveHandler);
            captions.off('CaptionsReceived', captionsReceivedHandler);
            captions.off('SpokenLanguageChanged', activeSpokenLanguageHandler);
            if (captions.captionsType === 'TeamsCaptions') {
                captions.off('CaptionLanguageChanged', activeCaptionLanguageHandler);
            }
        };
    }, []);

    const startCaptions = async () => {
        try {
            if (!captions.isCaptionsFeatureActive) {
                await captions.startCaptions({ spokenLanguage: 'en-us' });
            }
            captions.on('CaptionsActiveChanged', captionsActiveHandler);
            captions.on('CaptionsReceived', captionsReceivedHandler);
            captions.on('SpokenLanguageChanged', activeSpokenLanguageHandler);
            if (captions.captionsType === 'TeamsCaptions') {
                captions.on('CaptionLanguageChanged', activeCaptionLanguageHandler);
            }
        } catch (e) {
            console.error('startCaptions failed', e);
        }
    };

    const captionsActiveHandler = () => {
        console.log('CaptionsActiveChanged: ', captions.isCaptionsFeatureActive);
    }
    const activeSpokenLanguageHandler = () => {
        setCurrentSpokenLanguage(captions.activeSpokenLanguage);
    }
    const activeCaptionLanguageHandler = () => {
        setCurrentCaptionLanguage(captions.activeCaptionLanguage);
    }

    const captionsReceivedHandler = (captionData) => {
        let mri = '';
        if (captionData.speaker.identifier.kind === 'communicationUser') {
            mri = captionData.speaker.identifier.communicationUserId;
        } else if (captionData.speaker.identifier.kind === 'microsoftTeamsUser') {
            mri = captionData.speaker.identifier.microsoftTeamsUserId;
        } else if (captionData.speaker.identifier.kind === 'phoneNumber') {
            mri = captionData.speaker.identifier.phoneNumber;
        }

        if (mri.trim() == localMri && !isAgentSpeaking) {
            setIsAgentSpeaking(true)
        } else {
            setIsUserSpeaking(true)
        }

        let captionAreasContainer = document.getElementById('captionsArea');
        const newClassName = `prefix${mri.replace(/:/g, '').replace(/-/g, '').replace(/\+/g, '')}`;
        const captionText = `${captionData.timestamp.toUTCString()}
            ${captionData.speaker.displayName}: ${captionData.captionText ?? captionData.spokenText}`;

        let foundCaptionContainer = captionAreasContainer.querySelector(`.${newClassName}[isNotFinal='true']`);
        if (!foundCaptionContainer) {
            let captionContainer = document.createElement('div');
            captionContainer.setAttribute('isNotFinal', 'true');
            captionContainer.style['borderBottom'] = '1px solid';
            captionContainer.style['whiteSpace'] = 'pre-line';
            captionContainer.textContent = captionText;
            captionContainer.classList.add(newClassName);
            captionContainer.classList.add('caption-item')

            captionAreasContainer.appendChild(captionContainer);

        } else {
            foundCaptionContainer.textContent = captionText;

            if (captionData.resultType === 'Final') {
                foundCaptionContainer.setAttribute('isNotFinal', 'false');
            }
            window.captionHistory.push(`${captionData.speaker.displayName}: ${captionData.captionText ?? captionData.spokenText}`);
            mri == localMri ? setIsAgentSpeaking(false) : setIsUserSpeaking(false)
        }
    };

    const spokenLanguageSelectionChanged = async (event, item) => {
        const spokenLanguages = captions.supportedSpokenLanguages;
        const language = spokenLanguages.find(language => { return language === item.key });
        await captions.setSpokenLanguage(language);
        setCurrentSpokenLanguage(language);
    };

    const SpokenLanguageDropdown = () => {
        const keyedSupportedSpokenLanguages = captions.supportedSpokenLanguages.map(language => ({ key: language, text: language }));
        return <Dropdown
            selectedKey={currentSpokenLanguage}
            onChange={spokenLanguageSelectionChanged}
            label={'Spoken Language'}
            options={keyedSupportedSpokenLanguages}
            styles={{ label: { color: '#edebe9' }, dropdown: { width: 100 } }}
        />
    }

    const captionLanguageSelectionChanged = async (event, item) => {
        const captionLanguages = captions.supportedCaptionLanguages;
        const language = captionLanguages.find(language => { return language === item.key });
        await captions.setCaptionLanguage(language);
        setCurrentCaptionLanguage(language);
    };

    const CaptionLanguageDropdown = () => {
        const keyedSupportedCaptionLanguages = captions.supportedCaptionLanguages.map(language => ({ key: language, text: language }));
        return <Dropdown
            selectedKey={currentCaptionLanguage}
            onChange={captionLanguageSelectionChanged}
            label={'Caption Language'}
            options={keyedSupportedCaptionLanguages}
            styles={{ label: { color: '#edebe9' }, dropdown: { width: 100, overflow: 'scroll' } }}
        />
    }

    return (
        <>
            {captions && <SpokenLanguageDropdown />}
            {captions && captions.captionsType === 'TeamsCaptions' && <CaptionLanguageDropdown />}
            <div className="scrollable-captions-container">
                <div id="captionsArea" className="captions-area">
                </div>
            </div>
            <div className="participants-panel mt-1 mb-3">
                <Toggle label={
                    <div>
                        Communication AI{' '}
                        <TooltipHost content={`Turn on Communication AI`}>
                            <Icon iconName="Info" aria-label="Info tooltip" />
                        </TooltipHost>
                    </div>
                }
                    styles={{
                        text: { color: '#edebe9' },
                        label: { color: '#edebe9' },
                    }}
                    inlineLabel
                    onText="On"
                    offText="Off"
                    defaultChecked={communicationAI}
                    onChange={() => { setCommunicationAI(oldValue => !oldValue) }}
                />

                {
                    communicationAI &&
                    <CommunicationAI call={call} isAgentSpeaking={isAgentSpeaking} isUserSpeaking={isUserSpeaking} />
                }
            </div>
        </>
    );
};

export default CallCaption;
