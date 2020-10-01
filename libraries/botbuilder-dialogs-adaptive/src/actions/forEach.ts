/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, Dialog, DialogContext } from 'botbuilder-dialogs';
import { ActionScope, ActionScopeResult } from './actionScope';
import { StringExpression, BoolExpression, BoolExpressionConverter, StringExpressionConverter } from 'adaptive-expressions';

const INDEX = 'dialog.foreach.index';
const VALUE = 'dialog.foreach.value';

export class ForEach<O extends object = {}> extends ActionScope<O> {
    public static $kind = 'Microsoft.Foreach';

    public constructor();
    public constructor(itemsProperty: string, actions: Dialog[]);
    public constructor(itemsProperty?: string, actions?: Dialog[]) {
        super();
        if (itemsProperty) { this.itemsProperty = new StringExpression(itemsProperty); }
        if (actions) { this.actions = actions; }
    }

    /**
     * Property path expression to the collection of items.
     */
    public itemsProperty: StringExpression;

    /**
     * Property path expression to the item index.
     */
    public index: StringExpression = new StringExpression(INDEX);

    /**
     * Property path expression to the item value.
     */
    public value: StringExpression = new StringExpression(VALUE);

    /**
     * An optional expression which if is true will disable this action.
     */
    public disabled?: BoolExpression;

    public converters = {
        'itemsProperty': new StringExpressionConverter(),
        'index': new StringExpressionConverter(),
        'value': new StringExpressionConverter(),
        'disabled': new BoolExpressionConverter()
    };

    public getDependencies(): Dialog[] {
        return this.actions;
    }

    public async beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult> {
        if (this.disabled && this.disabled.getValue(dc.state)) {
            return await dc.endDialog();
        }
        dc.state.setValue(this.index.getValue(dc.state), -1);
        return await this.nextItem(dc);
    }

    protected async onBreakLoop(dc: DialogContext, actionScopeResult: ActionScopeResult): Promise<DialogTurnResult> {
        return await dc.endDialog();
    }

    protected async onContinueLoop(dc: DialogContext, actionScopeResult: ActionScopeResult): Promise<DialogTurnResult> {
        return await this.nextItem(dc);
    }

    protected async onEndOfActions(dc: DialogContext, result?: any): Promise<DialogTurnResult> {
        return await this.nextItem(dc);
    }

    protected async nextItem(dc: DialogContext): Promise<DialogTurnResult> {
        const itemsProperty = this.itemsProperty.getValue(dc.state);
        const items: any[] = dc.state.getValue(itemsProperty, []);
        let index = dc.state.getValue(this.index.getValue(dc.state));

        if (++index < items.length) {
            dc.state.setValue(this.value.getValue(dc.state), items[index]);
            dc.state.setValue(this.index.getValue(dc.state), index);
            return await this.beginAction(dc, 0);
        } else {
            return await dc.endDialog();
        }
    }

    protected onComputeId(): string {
        return `ForEach[${ this.itemsProperty.toString() }]`;
    }

}
