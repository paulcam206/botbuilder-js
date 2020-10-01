/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StringUtils } from 'botbuilder-core';
import { Dialog, DialogContext, DialogTurnResult } from 'botbuilder-dialogs';
import { Converter } from 'botbuilder-dialogs-declarative';
import { ValueExpression, StringExpression, BoolExpression, BoolExpressionConverter } from 'adaptive-expressions';
import { replaceJsonRecursively } from '../jsonExtensions';

class PropertyAssignmentsConverter implements Converter {
    public convert(assignments: { property: string; value: any }[]): PropertyAssignment[] {
        return assignments.map(item => {
            const { property, value } = item;
            return {
                property: new StringExpression(property),
                value: new ValueExpression(value)
            };
        });
    }
}

export interface PropertyAssignment {
    property: StringExpression;
    value: ValueExpression;
}

export class SetProperties<O extends object = {}> extends Dialog<O> {
    public static $kind = 'Microsoft.SetProperties';

    public constructor();
    public constructor(assignments?: PropertyAssignment[]) {
        super();
        if (assignments) { this.assignments = assignments; }
    }

    /**
     * Additional property settings as property/value pairs.
     */
    public assignments: PropertyAssignment[] = [];

    /**
     * An optional expression which if is true will disable this action.
     */
    public disabled?: BoolExpression;

    public converters = {
        'assignments': new PropertyAssignmentsConverter(),
        'disabled': new BoolExpressionConverter()
    };

    public async beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult> {
        if (this.disabled && this.disabled.getValue(dc.state)) {
            return await dc.endDialog();
        }

        for (let i = 0; i < this.assignments.length; i++) {
            const assignment = this.assignments[i];
            let value = assignment.value.getValue(dc.state);

            if (value) {
                value = replaceJsonRecursively(dc.state, value);
            }

            const property = assignment.property.getValue(dc.state);
            dc.state.setValue(property, value);
        }

        return await dc.endDialog();
    }

    protected onComputeId(): string {
        return `SetProperties[${ StringUtils.ellipsis(this.assignments.map((item): string => item.property.toString()).join(','), 50) }]`;
    }
}