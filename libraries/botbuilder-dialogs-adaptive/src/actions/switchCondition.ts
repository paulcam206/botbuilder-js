/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BoolExpression, BoolExpressionConverter, Expression, ExpressionConverter, ExpressionParser } from 'adaptive-expressions';
import { DialogTurnResult, DialogDependencies, Dialog, DialogContext } from 'botbuilder-dialogs';
import { Converter } from 'botbuilder-dialogs-declarative';
import { ActionScope } from './actionScope';
import { Case } from './case';

class CasesConverter implements Converter<any[], Case[]> {
    public convert(value: { value: string; actions: Dialog[] }[]): Case[] {
        return value.map(item => new Case(item.value, item.actions));
    }
}

export class SwitchCondition<O extends object = {}> extends Dialog<O> implements DialogDependencies {
    public static $kind = 'Microsoft.SwitchCondition';

    public constructor();
    public constructor(condition: string, defaultDialogs: Dialog[], cases: Case[]);
    public constructor(condition?: string, defaultDialogs?: Dialog[], cases?: Case[]) {
        super();
        if (condition) { this.condition = new ExpressionParser().parse(condition); }
        if (defaultDialogs) { this.default = defaultDialogs; }
        if (cases) { this.cases = cases; }
    }

    /**
     * Condition expression against memory.
     */
    public condition: Expression;

    /**
     * Default case.
     */
    public default: Dialog[] = [];

    /**
     * Cases.
     */
    public cases: Case[] = [];

    /**
     * An optional expression which if is true will disable this action.
     */
    public disabled?: BoolExpression;

    public converters = {
        'condition': new ExpressionConverter(),
        'cases': new CasesConverter(),
        'disabled': new BoolExpressionConverter()
    };

    private _caseExpresssions: any;

    private _defaultScope: ActionScope;

    public getDependencies(): Dialog[] {
        let dialogs: Dialog[] = [];
        if (this.default) {
            dialogs = dialogs.concat(this.defaultScope);
        }

        if (this.cases) {
            dialogs = dialogs.concat(this.cases);
        }
        return dialogs;
    }

    public async beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult> {
        if (this.disabled && this.disabled.getValue(dc.state)) {
            return await dc.endDialog();
        }

        if (!this._caseExpresssions) {
            this._caseExpresssions = {};
            for (let i = 0; i < this.cases.length; i++) {
                const caseScope = this.cases[i];
                const caseCondition = Expression.equalsExpression(this.condition, caseScope.createValueExpression());
                this._caseExpresssions[caseScope.value] = caseCondition;
            }
        }

        let actionScope = this.defaultScope;

        for (let i = 0; i < this.cases.length; i++) {
            const caseScope = this.cases[i];
            const caseCondition = this._caseExpresssions[caseScope.value] as Expression;
            const { value, error } = caseCondition.tryEvaluate(dc.state);
            if (error) {
                throw new Error(`Expression evaluation resulted in an error. Expression: ${ caseCondition.toString() }. Error: ${ error }`);
            }

            if (!!value) {
                actionScope = caseScope;
            }
        }

        return await dc.replaceDialog(actionScope.id);
    }

    protected get defaultScope(): ActionScope {
        if (!this._defaultScope) {
            this._defaultScope = new ActionScope(this.default);
        }
        return this._defaultScope;
    }

    protected onComputeId(): string {
        return `SwitchCondition[${ this.condition.toString() }]`;
    }
}
