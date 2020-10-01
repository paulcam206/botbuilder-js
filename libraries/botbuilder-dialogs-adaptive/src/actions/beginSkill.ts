/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BoolExpression, BoolExpressionConverter, StringExpression, StringExpressionConverter } from 'adaptive-expressions';
import { SkillDialog, SkillDialogOptions, DialogContext, DialogTurnResult, BeginSkillDialogOptions, DialogInstance, DialogReason } from 'botbuilder-dialogs';
import { Activity, ActivityTypes, StringUtils, TurnContext } from 'botbuilder-core';
import { TemplateInterface } from '../template';
import { skillClientKey, skillConversationIdFactoryKey } from '../skillExtensions';
import { ActivityTemplate } from '../templates';
import { ActivityTemplateConverter } from '../converters';

export class BeginSkill extends SkillDialog {
    public static $kind = 'Microsoft.BeginSkill';

    /**
     * Optional expression which if is true will disable this action.
     */
    public disabled?: BoolExpression;

    /**
     * Value indicating whether the new dialog should process the activity.
     * 
     * @remarks
     * The default for this will be true, which means the new dialog should not look at the activity. 
     * You can set this to false to dispatch the activity to the new dialog.
     */
    public activityProcessed = new BoolExpression(true);

    /**
     * Optional property path to store the dialog result in.
     */
    public resultProperty?: StringExpression;

    /**
     * The Microsoft App ID that will be calling the skill.
     * 
     * @remarks
     * Defauls to a value of `=settings.MicrosoftAppId` which retrievs the bots ID from settings.
     */
    public botId = new StringExpression('=settings.MicrosoftAppId');

    /**
     * The callback Url for the skill host.
     * 
     * @remarks
     * Defauls to a value of `=settings.SkillHostEndpoint` which retrieves the endpoint from settings.
     */
    public skillHostEndpoint = new StringExpression('=settings.SkillHostEndpoint');

    /**
     * The Microsoft App ID for the skill.
     */
    public skillAppId: StringExpression;

    /**
     * The `/api/messages` endpoint for the skill.
     */
    public skillEndpoint: StringExpression;

    /**
     * Template for the activity.
     */
    public activity: TemplateInterface<Partial<Activity>>;

    /**
     * Optional. The OAuth Connection Name for the Parent Bot.
     */
    public connectionName: StringExpression;

    public converters = {
        'disabled': new BoolExpressionConverter(),
        'activityProcessed': new BoolExpressionConverter(),
        'resultProperty': new StringExpressionConverter(),
        'botId': new StringExpressionConverter(),
        'skillHostEndpoint': new StringExpressionConverter(),
        'skillAppId': new StringExpressionConverter(),
        'skillEndpoint': new StringExpressionConverter(),
        'activity': new ActivityTemplateConverter(),
        'connectionName': new StringExpressionConverter()
    };

    // Used to cache DialogOptions for multi-turn calls across servers.
    private _dialogOptionsStateKey: string = `${ this.constructor.name }.dialogOptionsData`;

    /**
     * Creates a new `BeginSkillDialog instance.
     * @param options Optional options used to configure the skill dialog.
     */
    constructor(options?: SkillDialogOptions) {
        super(Object.assign({ skill: {} } as SkillDialogOptions, options));
    }

    public async beginDialog(dc: DialogContext, options?: BeginSkillDialogOptions): Promise<DialogTurnResult> {
        const dcState = dc.state;
        if (this.disabled && this.disabled.getValue(dcState)) {
            return await dc.endDialog();
        }

        // Setup the skill to call
        const botId = this.botId.getValue(dcState);
        const skillHostEndpoint = this.skillHostEndpoint.getValue(dcState);
        if (botId) { this.dialogOptions.botId = botId; }
        if (skillHostEndpoint) { this.dialogOptions.skillHostEndpoint = skillHostEndpoint; }
        if (this.skillAppId) { this.dialogOptions.skill.id = this.dialogOptions.skill.appId = this.skillAppId.getValue(dcState); }
        if (this.skillEndpoint) { this.dialogOptions.skill.skillEndpoint = this.skillEndpoint.getValue(dcState); }
        if (this.connectionName) { this.dialogOptions.connectionName = this.connectionName.getValue(dcState); }
        if (!this.dialogOptions.conversationState) { this.dialogOptions.conversationState = dc.dialogManager.conversationState; }
        if (!this.dialogOptions.skillClient) { this.dialogOptions.skillClient = dc.context.turnState.get(skillClientKey); }
        if (!this.dialogOptions.conversationIdFactory) { this.dialogOptions.conversationIdFactory = dc.context.turnState.get(skillConversationIdFactoryKey); }

        // Store the initialized dialogOptions in state so we can restore these values when the dialog is resumed.
        dc.activeDialog.state[this._dialogOptionsStateKey] = this.dialogOptions;

        // Get the activity to send to the skill.
        options = {} as BeginSkillDialogOptions;
        if (this.activityProcessed.getValue(dcState) && this.activity) {
            // The parent consumed the activity in context, use the Activity property to start the skill.
            const activity = await this.activity.bind(dc, dcState);

            this.telemetryClient.trackEvent({
                name: 'GeneratorResult',
                properties: {
                    'template': this.activity,
                    'result': activity || ''
                }
            });

            options.activity = activity;
        } else {
            // Send the turn context activity to the skill (pass through).
            options.activity = dc.context.activity;
        }

        // Call the base to invoke the skill
        return await super.beginDialog(dc, options);
    }

    public async continueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        this.loadDialogOptions(dc.context, dc.activeDialog);
        const activity = dc.context.activity;
        if (activity.type == ActivityTypes.EndOfConversation) {
            // Capture the result of the dialog if the property is set
            if (this.resultProperty && activity.value) {
                const dcState = dc.state;
                dc.state.setValue(this.resultProperty.getValue(dcState), activity.value);
            }
        }

        return await super.continueDialog(dc);
    }

    public async repromptDialog(turnContext: TurnContext, instance: DialogInstance): Promise<void> {
        this.loadDialogOptions(turnContext, instance);
        return await super.repromptDialog(turnContext, instance);
    }

    public async resumeDialog(dc: DialogContext, reason: DialogReason, result?: any): Promise<DialogTurnResult<any>> {
        this.loadDialogOptions(dc.context, dc.activeDialog);
        return await super.resumeDialog(dc, reason, result);
    }

    public async endDialog(turnContext: TurnContext, instance: DialogInstance, reason: DialogReason): Promise<void> {
        this.loadDialogOptions(turnContext, instance);
        return await super.endDialog(turnContext, instance, reason);
    }

    protected onComputeId(): string {
        const appId = this.skillAppId ? this.skillAppId.toString() : '';
        if (this.activity instanceof ActivityTemplate) {
            return `BeginSkill['${ appId }','${ StringUtils.ellipsis(this.activity.template.trim(), 30) }']`;
        }
        return `BeginSkill['${ appId }','${ StringUtils.ellipsis(this.activity && this.activity.toString().trim(), 30) }']`;
    }

    private loadDialogOptions(context: TurnContext, instance: DialogInstance): void {
        const dialogOptions = <SkillDialogOptions>instance.state[this._dialogOptionsStateKey];

        this.dialogOptions.botId = dialogOptions.botId;
        this.dialogOptions.skillHostEndpoint = dialogOptions.skillHostEndpoint;

        this.dialogOptions.conversationIdFactory = context.turnState.get(skillConversationIdFactoryKey);
        if (this.dialogOptions.conversationIdFactory == null) {
            throw new ReferenceError('Unable to locate skillConversationIdFactoryBase in HostContext.');
        };

        this.dialogOptions.skillClient = context.turnState.get(skillClientKey);
        if (this.dialogOptions.skillClient == null) {
            throw new ReferenceError('Unable to get an instance of conversationState from turnState.');
        };

        this.dialogOptions.connectionName = dialogOptions.connectionName;

        // Set the skill to call.
        this.dialogOptions.skill = dialogOptions.skill;
    }
}