/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ExpressionParserInterface, ExpressionParser } from 'adaptive-expressions';
import { TriggerSelector } from '../triggerSelector';
import { OnCondition } from '../conditions';
import { ActionContext } from '../actionContext';

/**
 * Select a random true rule implementation of TriggerSelector.
 */
export class RandomSelector implements TriggerSelector {
    public static $kind = 'Microsoft.RandomSelector';

    private _conditionals: OnCondition[];
    private _evaluate: boolean;

    /**
     * Gets or sets the expression parser to use.
     */
    public parser: ExpressionParserInterface = new ExpressionParser()
    
    public converters = {};

    public initialize(conditionals: OnCondition[], evaluate: boolean): void {
        this._conditionals = conditionals;
        this._evaluate = evaluate;
    }

    public select(actionContext: ActionContext): Promise<number[]> {
        const candidates = [];
        for (let i = 0; i < this._conditionals.length; i++) {
            if (this._evaluate) {
                const conditional = this._conditionals[i];
                const expression = conditional.getExpression(this.parser);
                const { value, error } = expression.tryEvaluate(actionContext.state);
                if (value && !error) {
                    candidates.push(i);
                }
            } else {
                candidates.push(i);
            }
        }

        const result = [];
        if (candidates.length > 0) {
            const selection = Math.floor(Math.random() * candidates.length);
            result.push(candidates[selection]);
        }

        return Promise.resolve(result);
    }

}