/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as Recognizers from '@microsoft/recognizers-text-date-time';
import { DialogContext } from 'botbuilder-dialogs';
import { InputDialog, InputState } from './inputDialog';
import { StringExpression, StringExpressionConverter } from 'adaptive-expressions';

export class DateTimeInput extends InputDialog {
    public static $kind = 'Microsoft.DateTimeInput';

    public defaultLocale: StringExpression;

    public outputFormat: StringExpression;

    public get converters() {
        return Object.assign({}, super.converters, {
            'defaultLocale': new StringExpressionConverter(),
            'outputFormat': new StringExpressionConverter()
        });
    }

    protected onComputeId(): string {
        return `DateTimeInput[${ this.prompt && this.prompt.toString() }]`;
    }

    protected async onRecognizeInput(dc: DialogContext): Promise<InputState> {
        // Recognize input and filter out non-attachments
        const input: object = dc.state.getValue(InputDialog.VALUE_PROPERTY);
        const locale: string = dc.context.activity.locale || this.defaultLocale.getValue(dc.state) || 'en-us';
        const results: any[] = Recognizers.recognizeDateTime(input.toString(), locale);

        if (results.length > 0 && results[0].resolution) {
            const values = results[0].resolution.values;
            dc.state.setValue(InputDialog.VALUE_PROPERTY, values);
            if (this.outputFormat) {
                const value = this.outputFormat.getValue(dc.state);
                dc.state.setValue(InputDialog.VALUE_PROPERTY, value);
            }
        } else {
            return InputState.unrecognized;
        }
        return InputState.valid;
    }

}