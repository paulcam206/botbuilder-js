/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Dialog, DialogContext, DialogTurnResult } from 'botbuilder-dialogs';
import { StringExpression, BoolExpression, BoolExpressionConverter, StringExpressionConverter } from 'adaptive-expressions';
import { Converter } from 'botbuilder-dialogs-declarative';

class PropertiesConverter implements Converter<string[], StringExpression[]> {
    public convert(value: string[]): StringExpression[] {
        return value.map(item => new StringExpression(item));
    }
}

export class DeleteProperties<O extends object = {}> extends Dialog<O> {
    public static $kind = 'Microsoft.DeleteProperties';

    public constructor();
    public constructor(properties?: string[]) {
        super();
        if (properties) {
            this.properties = properties.map((property): StringExpression => new StringExpression(property));
        }
    }

    /**
     * Collection of property paths to remove.
     */
    public properties: StringExpression[] = [];

    /**
     * An optional expression which if is true will disable this action.
     */
    public disabled?: BoolExpression;

    public converters = {
        'properties': new PropertiesConverter(),
        'disabled': new BoolExpressionConverter()
    };

    public async beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult> {
        if (this.disabled && this.disabled.getValue(dc.state)) {
            return await dc.endDialog();
        }

        if (this.properties && this.properties.length > 0) {
            for (let i = 0; i < this.properties.length; i++) {
                dc.state.deleteValue(this.properties[i].getValue(dc.state));
            }
        }

        return await dc.endDialog();
    }

    protected onComputeId(): string {
        return `DeleteProperties[${ this.properties.map((property): string => property.toString()).join(',') }]`;
    }
}