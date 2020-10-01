import { DeclarativeType } from './declarativeType';
import { ResourceExplorer } from './resources';

export interface ComponentDeclarativeTypes {
    getDeclarativeTypes(resourceExplorer: ResourceExplorer): DeclarativeType[];
}