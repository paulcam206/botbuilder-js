/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Culture }  from '@microsoft/recognizers-text';
import { DialogContext, ModelResult } from 'botbuilder-dialogs';
import { Entity } from 'botbuilder-core';
import { EntityRecognizer } from './entityRecognizer';
import { TextEntity } from './textEntity';

export abstract class TextEntityRecognizer implements EntityRecognizer {
    public converters = {};

    public async recognizeEntities(dialogContext: DialogContext, text: string, locale: string, entities: Entity[]): Promise<Entity[]> {
        const newEntities: Entity[] = [];
        const culture = Culture.mapToNearestLanguage(locale || '');
        const textEntities: TextEntity[] = entities.filter((e: Entity): boolean => e.type == 'text').map((e: Entity): TextEntity => {
            const textEntity = new TextEntity();
            return Object.assign(textEntity, e);
        });

        for (let i = 0; i < textEntities.length; i++) {
            const entity = textEntities[i];
            const results = this.recognize(entity.text, culture);
            for (let j = 0; j < results.length; j++) {
                const result = results[j];
                const newEntity: Entity = Object.assign({
                    type: result.typeName
                }, result);
                newEntity['typeName'] = undefined;
                newEntities.push(newEntity);
            }
        }

        return newEntities;
    }

    protected abstract recognize(text: string, culture: string): ModelResult[];
}