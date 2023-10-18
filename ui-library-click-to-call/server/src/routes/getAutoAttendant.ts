// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as express from 'express';
import { getAutoAttendantId } from '../lib/envHelper';

const router = express.Router();

/**
 * route: /getAutoAttendantId/
 *
 * purpose: Get the auto attendant id to call with the calling widget.
 *
 * @returns The call queue id as string
 *
 */

router.get('/', async function (req, res, next) {
  res.send(getAutoAttendantId());
});

export default router;
