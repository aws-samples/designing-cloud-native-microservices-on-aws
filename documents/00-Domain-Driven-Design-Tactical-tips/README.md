# Quick Guidance for Domain Driven Design - Tactical design pattern

## Classic Pattern guidance

### Entity

### Value Object

### Factory

Factory, just like the Factory pattern from GoF, way to encapsulate the complexity creation process and logic.

could be used in : 
> DomainService Factory, EntityFactory, 


### Aggregate


### Repository
Per repository should serve or mapping to an Aggregate Root, not for Entity or Value Object

### DomainService

Per DomainService could provide an Entity or Value Object which is a member of Aggregate Root.
That's means there shouldn't be any Entity or value object stand alone without Aggregate root.

### ApplicationService

### Module

###

## Advanced design guidance

### Invariants vs validation
Invariants — Invariants are generally business rules/enforcements/requirements that you impose to maintain the integrity of an object at any given time.

