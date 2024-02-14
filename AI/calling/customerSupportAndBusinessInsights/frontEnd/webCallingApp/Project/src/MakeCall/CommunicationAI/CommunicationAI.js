import React, { useState, useEffect } from "react";
import { Dropdown } from '@fluentui/react/lib/Dropdown';
import { utils, acsOpenAiPromptsApi } from "./Utils";
import {AgentSupportForm} from "./AgentSupportForm"


const CommunicationAI = ({ call, isAgentSpeaking, isUserSpeaking }) => {
    const [showSpinner, setShowSpinner] = useState(false);

    // Summary
    const [lastSummary, setLastSummary] = useState("");
    const [captionsSummaryIndex, setCaptionsSummaryIndex] = useState(0);

    // Feedback
    const [lastFeedBack, setLastFeedBack] = useState("");
    const [captionsFeedbackIndex, setCaptionsFeedbackIndex] = useState(0);

    // Sentiment
    const [lastSentiment, setLastSentiment] = useState("");
    const [captionsSentimentIndex, setCaptionsSentimentIndex] = useState(0);

    // Support Agent
    const [lastSupportAgentResponse, setLastSupportAgentResponse] = useState("");
    const [setCaptionsSupportAgentResponseIndex] = useState(0);

    const [promptMessage, setPromptMessage] = useState("");


    const [dropDownLabel, setDropDownLabel] = useState("")

    const [agentDebounceCounterRunning, setAgentDebounceCounterRunning] = useState(false);
    const [userDebounceCounterRunning, setUserDebounceCounterRunning] = useState(false);


    const [userName, setUserName] = useState("");
    const [address, setAddress] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [dateOfPurchase, setDateOfPurchase] = useState("");
    const [issue, setIssue] = useState("");
    const [productUnderWarranty, setProductUnderWarranty] = useState(false);
    const [issueTicket, setIssueTicket] = useState("");


    const options = [
        { key: 'getSummary', text: 'Get Summary' },
        { key: 'getPersonalFeedBack', text: 'Get Personal Feedback' },
        { key: 'getSentiments', text: 'Get Sentiment Feedback' },
        { key: 'getSuggestionForSupportAgent', text: 'Get Suggestion for Agent' },
    ]
    let agentDebounceTimeoutFn;
    let userDebounceTimeoutFn;
    let displayName = "Agent"

    useEffect(() => {
        call.on('stateChanged', () => {
            if (call.state === 'Disconnected') {
                callInsight(call.id);
            }
        });
    }, []);

    useEffect(() => {
        if (dropDownLabel == "") {
            setShowSpinner(false); 
            return
        }
        clearTimeout(agentDebounceTimeoutFn);
        if (dropDownLabel != "getSuggestionForSupportAgent") {
            if (isAgentSpeaking && !agentDebounceCounterRunning) {
                const message = "FeedBack will be retrieved after you finish talking";
                !showSpinner && setShowSpinner(true);
                setPromptMessage(message);
            } else {
                if (agentDebounceCounterRunning) {
                    agentDebounceTimeoutFn = setTimeout(() => {
                        setAgentDebounceCounterRunning(false);
                    }, 5000);
                } else {
                    dropDownHandler();
                }
            }
        }
        return () => {
            clearTimeout(agentDebounceTimeoutFn);
        }
    }, [isAgentSpeaking, agentDebounceCounterRunning, dropDownLabel]);

    useEffect(() => {
        if (dropDownLabel == "") {
            setShowSpinner(false); 
            return
        }
        clearTimeout(userDebounceTimeoutFn);
        if (isUserSpeaking && dropDownLabel == "getSuggestionForSupportAgent" && !userDebounceCounterRunning) {
            const message = "Support Suggestion will be retrieved after User finishes talking";
            !showSpinner && setShowSpinner(true);
            setPromptMessage(message);
        } else {
            if (userDebounceCounterRunning) {
                userDebounceTimeoutFn = setTimeout(() => {
                    setUserDebounceCounterRunning(false);
                }, 5000);
            } else {
                dropDownHandler();
            }
        }
        return () => {
            clearTimeout(userDebounceTimeoutFn);
        }
    }, [isUserSpeaking, userDebounceCounterRunning, dropDownLabel]);

    const dropDownHandler = async () => {
        dropDownLabel != "" && !showSpinner && setShowSpinner(true)
        setPromptMessage("Waiting for the AI response...");
        switch (dropDownLabel) {
            case "getSummary":
                await getSummary().finally(() => setShowSpinner(false));
                break;
            case "getPersonalFeedBack":
                await getPersonalFeedback().finally(() => setShowSpinner(false));
                break;
            case "getSentiments":
                await getSentiment().finally(() => setShowSpinner(false));
                break;
            case "getSuggestionForSupportAgent":
                await getSuggestionForSupportAgent().finally(() => setShowSpinner(false));
                break;
        }
    }

    const getSummary = async () => {
        try {
            const currentCaptionsData = window.captionHistory.slice(captionsSummaryIndex);
            let response = await utils.sendCaptionsDataToAcsOpenAI(acsOpenAiPromptsApi.summary, displayName, lastSummary, currentCaptionsData);
            let content = response.choices[0].message.content;
            console.log(`getSummary summary ===> ${JSON.stringify(response)}`)
            setLastSummary(content);
            setCaptionsSummaryIndex(window.captionHistory.length);
            displayResponse(content);
        } catch (error) {
            console.error(JSON.stringify(error))
        }
    }

    const getPersonalFeedback = async () => {
        try {
            const currentCaptionsData = window.captionHistory.slice(captionsFeedbackIndex);
            let response = await utils.sendCaptionsDataToAcsOpenAI(acsOpenAiPromptsApi.feedback, displayName, lastFeedBack, currentCaptionsData)
            let content = response.choices[0].message.content;
            console.log(`getPersonalFeedback ===> ${JSON.stringify(response)}`)
            setLastFeedBack(content);
            setCaptionsFeedbackIndex(window.captionHistory.length);
            displayResponse(content);
        } catch(error) {
            console.error(JSON.stringify(error))
        }
    }

    const getSentiment = async () => {
        try {
            const currentCaptionsData = window.captionHistory.slice(captionsSentimentIndex);
            let response = await utils.sendCaptionsDataToAcsOpenAI(acsOpenAiPromptsApi.sentiment, displayName, lastSentiment, currentCaptionsData)
            let content = response.emotions && response.emotions.join(", ")
            let callToAction = response.call_to_action;
            if (!content || !content.length) {
                content = "Neutral" //default is no senitment is detected
            }
            if (callToAction) {
                content += "\nRecommended Action:\n"
                content += callToAction;
            } 
            console.log(`getSentimentt ===> ${JSON.stringify(response)}`)
            setLastSentiment(content);
            setCaptionsSentimentIndex(window.captionHistory.length);
            displayResponse(content);
        } catch(error) {
            console.error(JSON.stringify(error))
        }
    }

    const getSuggestionForSupportAgent = async () => {
        try {
            let response = await utils.sendCaptionsDataToAcsOpenAI(acsOpenAiPromptsApi.supportAgent, 
                    displayName, lastSupportAgentResponse, window.captionHistory, true)
            let content = response.suggested_reply;
            console.log(`getSuggestionForSupportAgent ===> ${JSON.stringify(response)}`)
            console.log(`form_data ===> ${JSON.stringify(response.form_data)}`)
            retrieveFormData(response.form_data)
            setLastSupportAgentResponse(content);
            setCaptionsSupportAgentResponseIndex(window.captionHistory.length);
            displayResponse(content);
        } catch(error) {
            console.error(JSON.stringify(error))
        }
    }

    const callInsight = async (callId) => {
        await utils.sendCaptionsDataToAcsOpenAI(acsOpenAiPromptsApi.callInsights, displayName, '', window.captionHistory, true, callId);
    }

    const retrieveFormData = (form_data) => {
        if (form_data.name && form_data.name != 'N/A' && form_data.name != userName) {
            setUserName(form_data.name)
        }

        if (form_data.address && form_data.address != 'N/A' && form_data.address != address) {
            setAddress(form_data.address)
        }

        if (form_data.phone_number && form_data.phone_number != 'N/A' && form_data.phone_number != phoneNumber) {
            setPhoneNumber(form_data.phone_number)
        }

        if (form_data.date_of_purchase && form_data.date_of_purchase != 'N/A' && form_data.date_of_purchase != dateOfPurchase) {
            setDateOfPurchase(form_data.date_of_purchase)
        }

        if (form_data.issue_description && form_data.issue_description != 'N/A' && form_data.issue_description != issue) {
            setIssue(form_data.issue_description)
        }

        if (form_data.product_under_warranty && form_data.product_under_warranty != 'N/A' && form_data.product_under_warranty != productUnderWarranty) {
            setProductUnderWarranty(form_data.product_under_warranty)
        }

        if (form_data.support_ticket_number && form_data.support_ticket_number != 'N/A' && form_data.support_ticket_number != issueTicket) {
            setIssueTicket(form_data.support_ticket_number)
        }
    }

    const onChangeHandler = (e, item) => {
        setDropDownLabel(item.key);
    }

    const displayResponse = (responseText) => {
        let captionAreasContainer = document.getElementById(dropDownLabel);

        if(!responseText || !responseText.length) {return;}

        if (dropDownLabel == "getSuggestionForSupportAgent" || dropDownLabel == "getSentiments") {
            captionAreasContainer.style['font-size'] = '13px';
            captionAreasContainer.innerText  = responseText;
        } else {
            let aiResponseContent = document.createElement('div');
            aiResponseContent.style['borderBottom'] = '1px solid';
            aiResponseContent.style['padding'] = '10px';
            aiResponseContent.style['whiteSpace'] = 'pre-line';
            aiResponseContent.style['color'] = 'white';
            aiResponseContent.style['font-size'] = '12px';
            aiResponseContent.textContent = responseText;
            captionAreasContainer.appendChild(aiResponseContent);
        }
    }

    return (
        <>
            <div id="" className="">
                {
                    showSpinner &&
                    <div>
                        <div className="loader inline-block"> </div>
                        <div className="ml-2 inline-block">
                            {
                                promptMessage
                            }
                        </div>
                    </div>
                }
                <Dropdown
                    placeholder="Select an option"
                    label={dropDownLabel}
                    options={options}
                    styles={{ dropdown: { width: 300 }, }}
                    onChange={onChangeHandler}
                />
            </div>

            <div id="communicationResponse">
                {
                    dropDownLabel == "getSummary" && 
                    <div className="scrollable-captions-container">
                        <div id="getSummary" className="ai-captions-area">
                        </div>
                    </div>
                }

                {
                    dropDownLabel == "getSentimentt" && 
                    <div className="scrollable-captions-container">
                        <div id="getSentimentt" className="ai-captions-area">
                        </div>
                    </div>
                }

                {
                    dropDownLabel == "getPersonalFeedback" && 
                    <div className="scrollable-captions-container">
                        <div id="getPersonalFeedback" className="ai-captions-area">
                        </div>
                    </div>
                }

                {
                    dropDownLabel == "getSuggestionForSupportAgent" && 
                    <div className="card">
                        <div className="ms-Grid">
                            <div className="ms-Grid-row">
                                <div className="scrollable-captions-container ms-Grid-col ms-Grid-col ms-sm6 ms-md6 ms-lg6">
                                    <div id="getSuggestionForSupportAgent" className="captions-area">
                                        {lastSupportAgentResponse}
                                    </div>
                                </div>
                                {lastSupportAgentResponse && <AgentSupportForm 
                                    name = {userName}
                                    address = {address}
                                    phoneNumber = {phoneNumber}
                                    dateOfPurchase = {dateOfPurchase}
                                    issue = {issue}
                                    productUnderWarranty = {productUnderWarranty} 
                                    issueTicket = {issueTicket}
                                />}
                            </div>
                        </div>
                    </div>
                }
            </div>
        </>
    );
};

export default CommunicationAI;