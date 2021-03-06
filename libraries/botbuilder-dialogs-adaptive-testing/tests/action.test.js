const path = require('path');
const nock = require('nock');
const { TestRunner } = require('../lib');
const { MessageFactory } = require('botbuilder-core');

describe('ActionTests', function() {
    this.timeout(10000);
    const testRunner = new TestRunner(path.join(__dirname, 'resources/ActionTests'));

    it('AttachmentInput', async () => {
        await testRunner.runTestScript('Action_AttachmentInput');
    });

    it('BeginDialog', async () => {
        await testRunner.runTestScript('Action_BeginDialog');
    });

    it('BeginDialogWithActivity', async () => {
        await testRunner.runTestScript('Action_BeginDialogWithActivity');
    });

    it('CancelAllDialogs', async () => {
        await testRunner.runTestScript('Action_CancelAllDialogs');
    });

    it('CancelDialog', async () => {
        await testRunner.runTestScript('Action_CancelDialog');
    });

    it('CancelDialogs_Processed', async () => {
        await testRunner.runTestScript('Action_CancelDialog_Processed');
    });

    it('ChoiceInput', async () => {
        await testRunner.runTestScript('Action_ChoiceInput');
    });

    it('ChoiceInputWithLocale', async () => {
        await testRunner.runTestScript('Action_ChoiceInput_WithLocale');
    });

    it('ChoicesInMemory', async () => {
        await testRunner.runTestScript('Action_ChoicesInMemory');
    });

    it('ChoiceStringInMemory', async () => {
        await testRunner.runTestScript('Action_ChoiceStringInMemory');
    });

    it('ConfirmInput', async () => {
        await testRunner.runTestScript('Action_ConfirmInput');
    });

    it('DeleteActivity', async () => {
        await testRunner.runTestScript('Action_DeleteActivity');
    });

    it('DatetimeInput', async () => {
        await testRunner.runTestScript('Action_DatetimeInput');
    });

    it('DeleteProperties', async () => {
        await testRunner.runTestScript('Action_DeleteProperties');
    });

    it('DeleteProperty', async () => {
        await testRunner.runTestScript('Action_DeleteProperty');
    });

    it('DoActions', async () => {
        await testRunner.runTestScript('Action_DoActions');
    });

    it('DynamicBeginDialog', async () => {
        await testRunner.runTestScript('Action_DynamicBeginDialog');
    });

    it('EditActionReplaceSequence', async () => {
        await testRunner.runTestScript('Action_EditActionReplaceSequence');
    });

    it('EmitEvent', async () => {
        await testRunner.runTestScript('Action_EmitEvent');
    });

    it('EndDialog', async () => {
        await testRunner.runTestScript('Action_EndDialog');
    });

    it('Foreach_Nested', async () => {
        await testRunner.runTestScript('Action_Foreach_Nested');
    });

    it('Foreach', async () => {
        await testRunner.runTestScript('Action_Foreach');
    });

    it('Foreach_Empty', async () => {
        await testRunner.runTestScript('Action_Foreach_Empty');
    });

    it('ForeachPage_Empty', async () => {
        await testRunner.runTestScript('Action_ForeachPage_Empty');
    });

    it('ForeachPage_Nested', async () => {
        await testRunner.runTestScript('Action_ForeachPage_Nested');
    });

    it('ForeachPage_Partial', async () => {
        await testRunner.runTestScript('Action_ForeachPage_Partial');
    });

    it('ForeachPage', async () => {
        await testRunner.runTestScript('Action_ForeachPage');
    });

    it('GetActivityMembers', async () => {
        await testRunner.runTestScript('Action_GetActivityMembers');
    });

    it('GetConversationMembers', async () => {
        await testRunner.runTestScript('Action_GetConversationMembers');
    });

    it('GotoAction', async () => {
        await testRunner.runTestScript('Action_GotoAction');
    });

    it('HttpRequest', async () => {
        nock('http://foo.com').post('/', 'Joe is 52').reply(200, 'string');
        nock('http://foo.com').post('/', { text: 'Joe is 52', age: 52 }).reply(200, 'object');
        nock('http://foo.com').post('/', [{ text: 'Joe is 52', age: 52 }, { text: 'text', age: 11 }]).reply(200, 'array');
        nock('http://foo.com').get('/image').reply(200, 'TestImage');
        nock('http://foo.com').get('/json').reply(200, { test: 'test' });
        nock('http://foo.com').get('/activity').reply(200, MessageFactory.text('testtest'));
        nock('http://foo.com').get('/activities').reply(200, [MessageFactory.text('test1'), MessageFactory.text('test2'), MessageFactory.text('test3')]);
        await testRunner.runTestScript('Action_HttpRequest');
    });

    it('IfCondition', async () => {
        await testRunner.runTestScript('Action_IfCondition');
    });

    it('InputDialog_ActivityProcessed', async () => {
        await testRunner.runTestScript('InputDialog_ActivityProcessed');
    });

    it('NumerInput', async () => {
        await testRunner.runTestScript('Action_NumberInput');
    });

    it('NumerInputWithDefaultValue', async () => {
        await testRunner.runTestScript('Action_NumberInputWithDefaultValue');
    });

    it('NumberInputWithValueExpression', async () => {
        await testRunner.runTestScript('Action_NumberInputWithValueExpression');
    });

    it('RepeatDialog', async () => {
        await testRunner.runTestScript('Action_RepeatDialog');
    });

    it('RepeatDialogLoop', async () => {
        await testRunner.runTestScript('Action_RepeatDialogLoop');
    });

    it('ReplaceDialog', async () => {
        await testRunner.runTestScript('Action_ReplaceDialog');
    });

    it('SendActivity', async () => {
        await testRunner.runTestScript('Action_SendActivity');
    });

    it('SetProperties', async () => {
        await testRunner.runTestScript('Action_SetProperties');
    });

    it('SetProperty', async () => {
        await testRunner.runTestScript('Action_SetProperty');
    });

    it('SignOutUser', async () => {
        await testRunner.runTestScript('Action_SignOutUser');
    });

    it('Switch_Bool', async () => {
        await testRunner.runTestScript('Action_Switch_Bool');
    });

    it('Switch_Default', async () => {
        await testRunner.runTestScript('Action_Switch_Default');
    });

    it('Switch_Number', async () => {
        await testRunner.runTestScript('Action_Switch_Number');
    });

    it('Switch', async () => {
        await testRunner.runTestScript('Action_Switch');
    });

    it('TextInput', async () => {
        await testRunner.runTestScript('Action_TextInput');
    });

    it('TextInputWithInvalidPrompt', async () => {
        await testRunner.runTestScript('Action_TextInputWithInvalidPrompt');
    });

    it('TextInputWithValueExpression', async () => {
        await testRunner.runTestScript('Action_TextInputWithValueExpression');
    });

    it('TraceActivity', async () => {
        await testRunner.runTestScript('Action_TraceActivity');
    });

    it('UpdateActivity', async () => {
        await testRunner.runTestScript('Action_UpdateActivity');
    });

    it('WaitForInput', async () => {
        await testRunner.runTestScript('Action_WaitForInput');
    });
});
