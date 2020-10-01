/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Dialog, DialogDependencies, DialogContext, DialogTurnResult } from 'botbuilder-dialogs';
import { ValueExpression, ObjectExpression, BoolExpression, ObjectExpressionConverter, BoolExpressionConverter } from 'adaptive-expressions';
import { DialogExpression } from '../expressions';
import { replaceJsonRecursively } from '../jsonExtensions';
import { DialogExpressionConverter } from '../converters';
import { ResourceExplorer } from 'botbuilder-dialogs-declarative';


export class BaseInvokeDialog<O extends object = {}> extends Dialog<O> implements DialogDependencies {
    public constructor(dialogIdToCall?: string, bindingOptions?: O) {
        super();
        if (dialogIdToCall) {
            this.dialog = new DialogExpression(dialogIdToCall);
        }
        if (bindingOptions) {
            this.options = new ObjectExpression<object>(bindingOptions);
        }
    }

    /**
     * Configurable options for the dialog.
     */
    public options: ObjectExpression<object> = new ObjectExpression<object>();

    /**
     * The dialog to call.
     */
    public dialog: DialogExpression;

    /**
     * A value indicating whether to have the new dialog should process the activity.
     */
    public activityProcessed: BoolExpression = new BoolExpression(true);

    public get converters() {
        return {
            'options': new ObjectExpressionConverter<object>(),
            'dialog': (resourceExplorer: ResourceExplorer) => new DialogExpressionConverter(resourceExplorer),
            'activityProcessed': new BoolExpressionConverter()
        };
    }

    public beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult<any>> {
        throw new Error('Method not implemented.');
    }

    public getDependencies(): Dialog<{}>[] {
        if (this.dialog && this.dialog.value) {
            return [this.dialog.value];
        }
        return [];
    }

    protected onComputeId(): string {
        return `${ this.constructor.name }[${ this.dialog && this.dialog.toString() }]`;
    }

    protected resolveDialog(dc: DialogContext): Dialog {
        if (this.dialog && this.dialog.value) {
            return this.dialog.value;
        }

        const expression = this.dialog.toExpression();
        const { value: dialogId } = expression.tryEvaluate(dc.state);
        const dialog = dc.findDialog(dialogId);
        if (!dialog) {
            throw new Error(`${ this.dialog.toString() } not found.`);
        }

        return dialog;
    }

    protected bindOptions(dc: DialogContext, options: object): object {
        const bindingOptions = Object.assign({}, this.options.getValue(dc.state), options);
        const boundOptions = {};

        for (const key in bindingOptions) {
            const bindingValue = bindingOptions[key];
            let value = new ValueExpression(bindingValue).getValue(dc.state);

            if (value) {
                value = replaceJsonRecursively(dc.state, value);
            }

            boundOptions[key] = value;
        }

        return boundOptions;
    }
}