export interface CustomDeserializer {
    load(config: any, type: new () => {}): any;
}