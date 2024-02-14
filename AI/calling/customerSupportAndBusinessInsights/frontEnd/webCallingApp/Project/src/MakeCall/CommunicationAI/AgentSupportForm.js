import React, { useEffect, useState } from "react";
import {
    TextField, PrimaryButton, Checkbox, MessageBar,
    MessageBarType,
} from 'office-ui-fabric-react'
import { v4 as uuidv4 } from 'uuid';

export const AgentSupportForm = ({name, address, phoneNumber, dateOfPurchase, issue, productUnderWarranty}) => {
    const [userFullName, setUserFullName] = useState("");
    const [userAddress, setUserAddress] = useState("");
    const [userPhoneNumber, setUserPhoneNumber] = useState("");
    const [userDateOfPurchase, setUserDateOfPurchase] = useState("");
    const [IssueDescription, setIssueDescription] = useState("");
    const [underWarranty, setUnderWarranty] = useState(false);
    const [issueTicket, setIssueTicket] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false)

    useEffect(()=> {
        if (name !=  userFullName) {setUserFullName(name)}
        if (address !=  userAddress) {setUserAddress(address)}
        if (phoneNumber !=  userPhoneNumber) {setUserPhoneNumber(phoneNumber)}
        if (dateOfPurchase !=  userDateOfPurchase) {setUserDateOfPurchase(dateOfPurchase)}
        if (issue !=  IssueDescription) {setIssueDescription(issue)}
        if (productUnderWarranty !=  underWarranty) {setUnderWarranty(productUnderWarranty)}


        if (userFullName && userAddress && userPhoneNumber && userDateOfPurchase && IssueDescription) {
            console.log(`CHUK_TICKET === Updating Ticket number`);
            setIssueTicket(uuidv4())
        } else {
            console.log(`CHUK_TICKET === NOT Updating Ticket number`);
        }
    }, [name, address, phoneNumber, dateOfPurchase, issue, productUnderWarranty])

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true)
        setUserFullName("");
        setUserAddress("")
        setUserPhoneNumber("")
        setUserDateOfPurchase("")
        setIssueDescription("")
        setUnderWarranty(false)
        setIssueTicket("")
        setTimeout(() => {
            setIsSubmitted(false)
        }, 5000)
    }

    const FormSubmitted = () => {
        return (<MessageBar
          messageBarType={MessageBarType.success}
          isMultiline={false}
        >
          Ticket created successfully
        </MessageBar>)
    };

    return <>
        <div className="ms-Grid-col ms-Grid-col ms-sm6 ms-md6 ms-lg6" >
            {isSubmitted && FormSubmitted()}
            <div className="ms-Grid-row">
                <div className="ms-Grid-row">
                    <TextField
                        placeholder="FullName"
                        value={userFullName}
                        className="text-left"
                        onChange={(e) => { setUserFullName(e.target.value)}} 
                    />
                </div>
                <div className="ms-Grid-row">
                    <TextField
                        placeholder="Address"
                        value={userAddress}
                        className="text-left"
                        onChange={(e) => { setUserAddress(e.target.value)}} 
                    />
                </div>
                <div className="ms-Grid-row">
                    <TextField
                        placeholder="PhoneNumber" 
                        value={userPhoneNumber}
                        className="text-left"
                        onChange={(e) => { setUserPhoneNumber(e.target.value)}}  />
                </div>
                <div className="ms-Grid-row">
                    <TextField
                        placeholder="Date of Purchase" 
                        value={userDateOfPurchase}
                        className="text-left"
                        onChange={(e) => { setUserDateOfPurchase(e.target.value)}}  />
                </div>
                <div className="ms-Grid-row">
                    <TextField
                        placeholder="Issue Description" 
                        multiline rows={5}
                        value={IssueDescription}
                        className="text-left"
                        onChange={(e) => { setIssueDescription(e.target.value)}}  />
                </div>
                <div className="ms-Grid-row">
                    <Checkbox label="Product under Warranty"  checked={underWarranty} onChange={(e, checked) => {setUnderWarranty(checked)}} />
                </div>

                <div className="ms-Grid-row">
                    <TextField
                        placeholder="Issue Ticket#"
                        value={issueTicket}
                        className="text-left"
                        onChange={(e) => { setIssueTicket(e.target.value)}}
                    />
                </div>
            </div>
            <div className="ms-Grid-row">
                <div className="ms-Grid-col">
                    <PrimaryButton className="primary-button mt-5 text-left"

                        onClick={(e) => {handleSubmit(e)}}>
                            Submit Ticket
                    </PrimaryButton>
                </div>
            </div>
        </div>
    </>
}