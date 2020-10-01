/**
 * @module botbuilder-dialogs-adaptive-testing
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { TestAction } from '../testAction';
import { AdaptiveTestAdapter } from '../adaptiveTestAdapter';

export interface UserDelayConfiguration {
    timespan?: number;
}

export class UserDelay implements TestAction {
    public static $kind = 'Microsoft.Test.UserDelay';

    /**
     * The timespan in milliseconds to delay.
     */
    public timespan: number;
    
    public converters = {};

    public async execute(_testAdapter: AdaptiveTestAdapter, _callback: (context: TurnContext) => Promise<any>): Promise<any> {
        await Promise.resolve(resolve => setTimeout(resolve, this.timespan));
    }
}