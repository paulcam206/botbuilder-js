/**
 * @module botbuilder-dialogs-declarative
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ComponentRegistration } from 'botbuilder';
import { Dialog } from 'botbuilder-dialogs';
import { normalize, join } from 'path';
import { EventEmitter } from 'events';
import { ResourceProvider, ResourceChangeEvent } from './resourceProvider';
import { FolderResourceProvider } from './folderResourceProvider';
import { Resource } from './resource';
import { PathUtil } from '../pathUtil';
import { ComponentDeclarativeTypes } from '../componentDeclarativeTypes';
import { DeclarativeType } from '../declarativeType';
import { CustomDeserializer } from '../customDeserializer';
import { DefaultLoader } from '../defaultLoader';

/**
 * Class which gives standard access to content resources.
 */
export class ResourceExplorer {
    private _kindToType: Map<string, new () => {}> = new Map();
    private _kindDeserializer: Map<string, CustomDeserializer> = new Map();
    private _eventEmitter: EventEmitter = new EventEmitter();
    private _typesLoaded = false;

    /**
     * Initializes a new instance of the `ResourceExplorer` class.
     * @param providers Resource providers.
     */
    public constructor(providers: ResourceProvider[] = []) {
        this.resourceProviders = providers;
    }

    /**
     * Gets resource providers.
     */
    public readonly resourceProviders: ResourceProvider[];

    /**
     * Gets resource type id extensions managed by resource explorer.
     */
    public readonly resourceTypes: Set<string> = new Set(['dialog', 'lu', 'lg', 'qna', 'schema', 'json']);

    /**
     * Event which fires when a resource is changed.
     */
    public set changed(callback: (event: ResourceChangeEvent, resources: Resource[]) => void) {
        this._eventEmitter.on(ResourceChangeEvent.added, (resources: Resource[]): void => {
            callback(ResourceChangeEvent.added, resources);
        });
        this._eventEmitter.on(ResourceChangeEvent.changed, (resources: Resource[]): void => {
            callback(ResourceChangeEvent.changed, resources);
        });
        this._eventEmitter.on(ResourceChangeEvent.removed, (resources: Resource[]): void => {
            callback(ResourceChangeEvent.removed, resources);
        });
    }

    /**
     * Add a resource type to resource type set.
     * @param type Resource type.
     */
    public addResourceType(type: string): void {
        type = type.toLowerCase().replace(/^\./, '');
        if (!this.resourceTypes.has(type)) {
            this.resourceTypes.add(type);
            this.refresh();
        }
    }

    /**
     * Reload any cached data.
     */
    public refresh(): void {
        for (let i = 0; i < this.resourceProviders.length; i++) {
            this.resourceProviders[i].refresh();
        }
    }

    /**
     * Add a resource provider to the resources managed by resource explorer.
     * @param resourceProvider Resource provider to be added.
     */
    public addResourceProvider(resourceProvider: ResourceProvider): ResourceExplorer {
        if (this.resourceProviders.some((r): boolean => r.id === resourceProvider.id)) {
            throw Error(`${ resourceProvider.id } has already been added as a resource`);
        }

        resourceProvider.changed = this.onChanged.bind(this);
        this.resourceProviders.push(resourceProvider);

        return this;
    }

    /**
     * Add a folder resource.
     * @param folder Folder to be included as a resource.
     * @param includeSubFolders Whether to include subfolders.
     * @param monitorChanges Whether to track changes.
     */
    public addFolder(folder: string, includeSubFolders: boolean = true, monitorChanges: boolean = true): ResourceExplorer {
        this.addResourceProvider(new FolderResourceProvider(this, folder, includeSubFolders, monitorChanges));

        return this;
    }

    /**
     * Add folder resources.
     * @param folder Collection of folders to be included as resources.
     * @param ignoreFolders Imediate subfolders to ignore.
     * @param monitorChanges Whether to track changes.
     */
    public addFolders(folder: string, ignoreFolders?: string[], monitorChanges: boolean = true): ResourceExplorer {
        if (ignoreFolders) {
            folder = normalize(folder);
            this.addFolder(folder, false, monitorChanges);
            const ignoreFoldersSet = new Set<string>(ignoreFolders.map((p): string => join(folder, p)));
            const subFolders = PathUtil.getDirectories(folder);
            for (let i = 0; i < subFolders.length; i++) {
                const subFolder = subFolders[i];
                if (!ignoreFoldersSet.has(subFolder)) {
                    this.addFolder(subFolder, true, monitorChanges);
                }
            }
        } else {
            this.addFolder(folder, true, monitorChanges);
        }

        return this;
    }

    /**
     * Get resources of a given type extension.
     * @param fileExtension File extension filter.
     */
    public getResources(fileExtension: string): Resource[] {
        let resources: Resource[] = [];
        for (const rp of this.resourceProviders) {
            for (const rpResources of rp.getResources(fileExtension)) {
                resources.push(rpResources);
            }
        }

        return resources;
    }

    /**
     * Gets resource by id.
     * @param id Resource id.
     */
    public getResource(id: string): Resource {
        for (const rp of this.resourceProviders) {
            const resource: Resource = rp.getResource(id);
            if (resource) {
                return resource;
            }
        }

        return undefined;
    }

    /**
     * Load types from resource or resource id.
     * @param resource Resource or resource id to be parsed as a type.
     */
    public loadType<T extends object>(resource: string | Resource): T {
        this.registerComponentTypes();

        if (typeof resource == 'string') {
            resource = this.getResource(resource);
        }

        if (!resource) {
            throw new Error(`Resource ${ resource.id } not found.`);
        }

        const json = resource.readText();
        const result = JSON.parse(json, (_key: string, value: unknown): any => {
            if (typeof value !== 'object') {
                return value;
            }
            if (Array.isArray(value)) {
                return value;
            }
            const kind = value['$kind'];
            if (!kind) {
                return value;
            }
            return this.load(value);
        }) as T;

        if (result instanceof Dialog && !result['id']) {
            // If there is no id for the dialog, then the resource id would be used as dialog id.
            result.id = resource.id;
        }

        return result;
    }

    protected onChanged(event: ResourceChangeEvent, resources: Resource[]): void {
        if (this._eventEmitter) {
            this._eventEmitter.emit(event, resources);
        }
    }

    private load<T extends object>(value: Record<string, any>): T {
        const kind = value['$kind'];
        const type = this._kindToType.get(kind);
        if (!type) {
            throw new Error(`Type ${ kind } not registered.`);
        }
        const loader = this._kindDeserializer.get(kind);
        return loader.load(value, type) as T;
    }

    private getComponentRegistrations(): ComponentRegistration[] {
        return ComponentRegistration.components.filter((component: ComponentRegistration) => 'getDeclarativeTypes' in component);
    }

    private registerTypeInternal(kind: string, type: new () => {}, loader?: CustomDeserializer): void {
        this._kindToType.set(kind, type);
        this._kindDeserializer.set(kind, loader || new DefaultLoader(this));
    }
    
    private registerComponentTypes(): void {
        if (this._typesLoaded) {
            return;
        }
        this._typesLoaded = true;
        this.getComponentRegistrations().forEach((component: ComponentDeclarativeTypes) => {
            component.getDeclarativeTypes(this).forEach((declarativeType: DeclarativeType) => {
                const { kind, type, loader } = declarativeType;
                this.registerTypeInternal(kind, type, loader);
            });
        });
    }
}