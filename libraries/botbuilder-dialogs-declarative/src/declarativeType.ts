import { CustomDeserializer } from './customDeserializer';

export interface DeclarativeType {
    kind: string;
    type: new () => unknown;
    loader?: CustomDeserializer;
}