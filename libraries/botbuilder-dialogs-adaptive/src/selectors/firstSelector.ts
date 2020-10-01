/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ExpressionParser, ExpressionParserInterface } from 'adaptive-expressions';
import { OnCondition } from '../conditions/onCondition';
import { TriggerSelector } from '../triggerSelector';
import { ActionContext } from '../actionContext';

/**
 * Select the first true rule implementation of TriggerSelector
 */
export class FirstSelector implements TriggerSelector {
    public static $kind = 'Microsoft.FirstSelector';

    private _conditionals: OnCondition[];
    private _evaluate: boolean;

    /**
     * Gets or sets the expression parser to use.
     */
    public parser: ExpressionParserInterface = new ExpressionParser()
    
    public converters = {};

    public initialize(conditionals: OnCondition[], evaluate: boolean) {
        this._conditionals = conditionals;
        this._evaluate = evaluate;
    }

    public select(actionContext: ActionContext): Promise<number[]> {
        let selection = -1;
        if (this._evaluate) {
            for (let i = 0; i < this._conditionals.length; i++) {
                const conditional = this._conditionals[i];
                const expression = conditional.getExpression(this.parser);
                const { value, error } = expression.tryEvaluate(actionContext.state);
                if (value && !error) {
                    selection = i;
                    break;
                }
            }
        } else {
            if (this._conditionals.length > 0) {
                selection = 0;
            }
        }

        const result = [];
        if (selection != -1) {
            result.push(selection);
        }

        return Promise.resolve(result);
    }
}