// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as express from 'express';
import { getCallQueueId } from '../lib/envHelper';

const router = express.Router();

/**
 * route: /getCallQueueId/
 *
 * purpose: Get the call queue id to call with the calling widget.
 *
 * @returns The call queue id as string
 *
 */

router.get('/', async function (req, res, next) {
  res.send(getCallQueueId());
});

export default router;
