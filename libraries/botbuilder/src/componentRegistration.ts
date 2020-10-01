export class ComponentRegistration {
    private static readonly _components: Map<string, ComponentRegistration> = new Map<string, ComponentRegistration>();
    
    public static get components(): ComponentRegistration[] {
        return Array.from(ComponentRegistration._components.values());
    }
    
    public static add(componentRegistration: ComponentRegistration): void {
        const name = componentRegistration.constructor.name;
        ComponentRegistration._components.set(name, componentRegistration);
    }
}