/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogContext, Dialog } from 'botbuilder-dialogs';
import { ValueExpression, BoolExpression, BoolExpressionConverter, ValueExpressionConverter } from 'adaptive-expressions';
import { replaceJsonRecursively } from '../jsonExtensions';

export class EndDialog<O extends object = {}> extends Dialog<O> {
    public static $kind = 'Microsoft.EndDialog';

    /**
     * Creates a new `EndDialog` instance.
     * @param value (Optional) A value expression for the result to be returned to the caller
     */
    public constructor();
    public constructor(value?: any) {
        super();
        if (value) { this.value = new ValueExpression(value); }
    }

    /**
     * A value expression for the result to be returned to the caller.
     */
    public value: ValueExpression;

    /**
     * An optional expression which if is true will disable this action.
     */
    public disabled?: BoolExpression;

    public converters = {
        'value': new ValueExpressionConverter(),
        'disabled': new BoolExpressionConverter()
    };

    public async beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult> {
        if (this.disabled && this.disabled.getValue(dc.state)) {
            return await dc.endDialog();
        }

        if (this.value) {
            let value = this.value.getValue(dc.state);

            if (value) {
                value = replaceJsonRecursively(dc.state, value);
            }

            return await this.endParentDialog(dc, value);
        }

        return await this.endParentDialog(dc);
    }

    protected async endParentDialog(dc: DialogContext, result?: any): Promise<DialogTurnResult> {
        if (dc.parent) {
            const turnResult = await dc.parent.endDialog(result);
            turnResult.parentEnded = true;
            return turnResult;
        } else {
            return await dc.endDialog(result);
        }
    }

    protected onComputeId(): string {
        return `EndDialog[${ this.value ? this.value.toString() : '' }]`;
    }
}