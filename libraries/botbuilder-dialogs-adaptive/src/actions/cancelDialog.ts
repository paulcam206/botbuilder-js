/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CancelAllDialogsBase } from './cancelAllDialogsBase';

export class CancelDialog<O extends object = {}> extends CancelAllDialogsBase<O> {
    public static $kind = 'Microsoft.CancelDialog';

    public constructor();
    public constructor(eventName: string, eventValue?: string);
    public constructor(eventName?: string, eventValue?: string) {
        super(eventName, eventValue, false);
    }
}