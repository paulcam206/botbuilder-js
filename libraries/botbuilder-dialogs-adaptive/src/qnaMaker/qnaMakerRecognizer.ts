/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DialogContext } from 'botbuilder-dialogs';
import { RecognizerResult, Activity } from 'botbuilder-core';
import { RankerTypes, QnAMakerMetadata, QnAMaker, QnAMakerEndpoint, QnAMakerOptions, QnAMakerResult, QnARequestContext } from 'botbuilder-ai';
import { Recognizer } from '../recognizers/recognizer';
import { StringExpression, IntExpression, NumberExpression, BoolExpression, ArrayExpression, ObjectExpression, ArrayExpressionConverter, BoolExpressionConverter, IntExpressionConverter, NumberExpressionConverter, ObjectExpressionConverter, StringExpressionConverter } from 'adaptive-expressions';

const intentPrefix = 'intent=';

/**
 * A recognizer which uses QnAMaker KB to recognize intents.
 */
export class QnAMakerRecognizer extends Recognizer {
    public static $kind = 'Microsoft.QnAMakerRecognizer';
    public static readonly qnaMatchIntent = 'QnAMatch';

    /**
     * Knowledgebase id of your QnA maker knowledgebase.
     */
    public knowledgeBaseId: StringExpression;

    /**
     * Host name of the QnA maker knowledgebase.
     */
    public hostname: StringExpression;

    /**
     * Endpoint key for the QnA service.
     */
    public endpointKey: StringExpression;

    /**
     * Number of results you want.
     */
    public top: IntExpression = new IntExpression(3);

    /**
     * Threshold for the results.
     */
    public threshold: NumberExpression = new NumberExpression(0.3);

    /**
     * A value indicating whether to call test or prod environment of knowledgebase.
     */
    public isTest: boolean;

    /**
     * Desired RankerType.
     */
    public rankerType: StringExpression = new StringExpression(RankerTypes.default);

    /**
     * Whether to include the dialog name metadata for QnA context.
     */
    public includeDialogNameInMetadata: BoolExpression = new BoolExpression(true);

    /**
     * An expression to evaluate to set additional metadata name value pairs.
     */
    public metadata: ArrayExpression<QnAMakerMetadata>;

    /**
     * An expression to evaluate to set the context.
     */
    public context: ObjectExpression<QnARequestContext>;

    /**
     * An expression to evaluate to set QnAId parameter.
     */
    public qnaId: IntExpression = new IntExpression(0);

    public converters = {
        'knowledgeBaseId': new StringExpressionConverter(),
        'hostname': new StringExpressionConverter(),
        'endpointKey': new StringExpressionConverter(),
        'top': new IntExpressionConverter(),
        'threshold': new NumberExpressionConverter(),
        'rankerType': new StringExpressionConverter(),
        'includeDialogNameInMetadata': new BoolExpressionConverter(),
        'metadata': new ArrayExpressionConverter(),
        'context': new ObjectExpressionConverter(),
        'qnaId': new IntExpressionConverter()
    };

    /**
     * Initializes a new instance of `QnAMakerRecognizer`.
     * @param hostname Hostname of QnAMaker KB.
     * @param knowledgeBaseId Id of QnAMaker KB.
     * @param endpointKey Endpoint key of QnAMaker KB.
     */
    public constructor(hostname?: string, knowledgeBaseId?: string, endpointKey?: string) {
        super();
        if (hostname) { this.hostname = new StringExpression(hostname); }
        if (knowledgeBaseId) { this.knowledgeBaseId = new StringExpression(knowledgeBaseId); }
        if (endpointKey) { this.endpointKey = new StringExpression(endpointKey); }
    }

    /**
     * Gets results of the call to QnA maker KB.
     * @param dc Context object containing information for a single turn of coversation with a user.
     * @param activity The incoming activity received from the user. The text value is used as the query to QnA Maker.
     * @param telemetryProperties Additional properties to be logged to telemetry.
     * @param telemetryMetrics Additional metrics to be logged to telemetry.
     */
    public async recognize(dc: DialogContext, activity: Activity, telemetryProperties?: { [key: string]: string }, telemetryMetrics?: { [key: string]: number }): Promise<RecognizerResult> {
        // identify matched intents
        const recognizerResult: RecognizerResult = {
            text: activity.text,
            intents: {},
            entities: {}
        };

        if (!activity.text) {
            recognizerResult.intents['None'] = { score: 1 };
            return recognizerResult;
        }

        const filters: QnAMakerMetadata[] = [];
        if (this.includeDialogNameInMetadata && this.includeDialogNameInMetadata.getValue(dc.state)) {
            const metadata: QnAMakerMetadata = {
                name: 'dialogName',
                value: dc.activeDialog && dc.activeDialog.id
            };
            filters.push(metadata);
        }

        // if there is $qna.metadata set add to filters
        const externalMetadata: QnAMakerMetadata[] = this.metadata && this.metadata.getValue(dc.state);
        if (externalMetadata) {
            filters.push(...externalMetadata);
        }

        // calling QnAMaker to get response
        const qnaMaker = this.getQnAMaker(dc);
        const qnaMakerOptions: QnAMakerOptions = {
            context: this.context && this.context.getValue(dc.state),
            scoreThreshold: this.threshold && this.threshold.getValue(dc.state),
            strictFilters: filters,
            top: this.top && this.top.getValue(dc.state),
            qnaId: this.qnaId && this.qnaId.getValue(dc.state),
            rankerType: this.rankerType && this.rankerType.getValue(dc.state),
            isTest: this.isTest
        };
        const answers = await qnaMaker.getAnswers(dc.context, qnaMakerOptions);

        if (answers && answers.length > 0) {
            let topAnswer: QnAMakerResult;
            for (let i = 0; i < answers.length; i++) {
                const answer = answers[i];
                if (!topAnswer || (answer.score > topAnswer.score)) {
                    topAnswer = answer;
                }
            }

            if (topAnswer.answer.trim().toLowerCase().startsWith(intentPrefix)) {
                recognizerResult.intents[topAnswer.answer.trim().substr(intentPrefix.length).trim()] = { score: topAnswer.score };
            } else {
                recognizerResult.intents[QnAMakerRecognizer.qnaMatchIntent] = { score: topAnswer.score };
            }

            recognizerResult.entities['answer'] = [topAnswer.answer];
            recognizerResult.entities['$instance'] = {
                answer: [Object.assign(topAnswer, {
                    startIndex: 0,
                    endIndex: activity.text.length
                })]
            };
            recognizerResult['answers'] = answers;
        } else {
            recognizerResult.intents['None'] = { score: 1 };
        }
        this.trackRecognizerResult(dc, 'QnAMakerRecognizerResult', this.fillRecognizerResultTelemetryProperties(recognizerResult, telemetryProperties), telemetryMetrics);
        return recognizerResult;
    }

    /**
     * Gets an instance of `QnAMaker`.
     * @param dc The dialog context used to access state.
     */
    protected getQnAMaker(dc: DialogContext): QnAMaker {
        const endpointKey = this.endpointKey && this.endpointKey.getValue(dc.state);
        const hostname = this.hostname && this.hostname.getValue(dc.state);
        const knowledgeBaseId = this.knowledgeBaseId && this.knowledgeBaseId.getValue(dc.state);

        const endpoint: QnAMakerEndpoint = {
            endpointKey: endpointKey,
            host: hostname,
            knowledgeBaseId: knowledgeBaseId
        };
        return new QnAMaker(endpoint);
    }
}