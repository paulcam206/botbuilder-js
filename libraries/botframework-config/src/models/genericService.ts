/**
 * @module botframework-config
 *
 * Copyright(c) Microsoft Corporation.All rights reserved.
 * Licensed under the MIT License.
 */
import { IGenericService, ServiceTypes } from '../schema';
import { ConnectedService } from './connectedService';

/**
 * Defines a generic service connection.
 * @deprecated See https://aka.ms/bot-file-basics for more information.
 */
export class GenericService extends ConnectedService implements IGenericService {
    /**
     * Deep link to service.
     */
    public url: string;

    /**
     * Named/value configuration data.
     */
    public configuration: { [key: string]: string };

    /**
     * Creates a new GenericService instance.
     * @param source (Optional) JSON based service definition.
     */
    constructor(source: IGenericService = {} as IGenericService) {
        super(source, ServiceTypes.Generic);
    }

    public encrypt(secret: string, encryptString: (value: string, secret: string) => string): void {
        const that: GenericService = this;
        if (this.configuration) {
            Object.keys(this.configuration).forEach((prop: string) => {
                that.configuration[prop] = encryptString(that.configuration[prop], secret);
            });
        }
    }

    public decrypt(secret: string, decryptString: (value: string, secret: string) => string): void {
        const that: GenericService = this;
        if (this.configuration) {
            Object.keys(this.configuration).forEach((prop: string) => {
                that.configuration[prop] = decryptString(that.configuration[prop], secret);
            });
        }
    }
}
