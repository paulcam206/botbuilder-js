/**
 * @module botbuilder-ai-orchestrator
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ComponentRegistration } from 'botbuilder';
import { OrchestratorAdaptiveRecognizer } from './orchestratorAdaptiveRecognizer';

export class OrchestratorComponentRegistration extends ComponentRegistration {
    public getDeclarativeTypes(resourceExplorer: unknown) {
        return [{
            kind: OrchestratorAdaptiveRecognizer.$kind,
            type: OrchestratorAdaptiveRecognizer
        }];
    }
}
