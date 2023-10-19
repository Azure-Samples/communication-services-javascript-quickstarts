// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import express from 'express';
import cors from 'cors';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import path from 'path';

import issueToken from './routes/issueToken';
import refreshToken from './routes/refreshToken';
import getEndpointUrl from './routes/getEndpointUrl';
import userConfig from './routes/userConfig';
import addUser from './routes/addUser';
import getCallQueueId from './routes/getCallQueue';
import getAutoAttendantId from './routes/getAutoAttendant';

const app = express();

app.use(logger('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, 'build')));

/**
 * route: /addUser
 * purpose: Chat: add the user to the chat thread
 */
app.use('/addUser', cors(), addUser);

/**
 * route: /refreshToken
 * purpose: Chat,Calling: get a new token
 */
app.use('/refreshToken', cors(), refreshToken);

/**
 * route: /getEndpointUrl
 * purpose: Chat,Calling: get the endpoint url of ACS resource
 */
app.use('/getEndpointUrl', cors(), getEndpointUrl);

/**
 * route: /token
 * purpose: Chat,Calling: get ACS token with the given scope
 */
app.use('/token', cors(), issueToken);

/**
 * route: /userConfig
 * purpose: Chat: to add user details to userconfig for chat thread
 */
app.use('/userConfig', cors(), userConfig);

/**
 * route: /getCallQueueId
 * purpose: Calling: get the id of the call queue to call
 */
app.use('/getCallQueueId', cors(), getCallQueueId);

/**
 * route: /getAutoAttendantId
 * purpose: Calling: get the id of the auto attendant to call
 */
app.use('/getAutoAttendantId', cors(), getAutoAttendantId)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

export default app;
