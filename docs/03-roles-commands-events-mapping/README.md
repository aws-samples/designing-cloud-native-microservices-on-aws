_[< back to 02 Coffee Shop Scenario](../02-coffee-shop-scenario/README.md)_

## Roles, Commands and Events Mapping

### Key Business events in the coffeeshop

#### :bulb: Tips:
When capturing Events in business scenarios, be aware that domain experts may or may not be technical. Use **ubiquitous language** to communicate.
- Events discovering process should not be technical
- Focus on the core business value
- Figure out trigger and result

![](../img/coffee-shop-events-v2.png)

**An example of the immutable events occurred:**
* Menu offered
* Ordered 2 cups of Americano
* Completed payment
* Received receipt
* Seat occupied
* Order received
* Coffee prepared
* Customer left premise
* Cleaned up table

You can always arrange these events sequentially in the timeline where it occurred.

### Commands and Events mapping

Now, let's add in *Commands*. Commands are triggers, actions or intention that result in the event. Label them with a blue sticky note. Use present tense for Commands.

![](../img/coffee-shop-role-trigger-v2.png)

### Roles

As you explore these events, think about the key players involved in these Events. We call them Roles. Roles can represent a human or a system. Use a yellow sticky note to represent them. You should end up with something as follow.

![](../img/coffee-shop-event-trigger-v2.png)

The roles involved would be:
* Customer
* Cashier
* Barista
* Waiter

![](../img/coffee-shop-role-trigger-v3.png)

Commands can be triggered by another event, person or even systems, both internal or external.

We shall call the interface between the *Command* and *Event* as a "(?)" for now. This is a key element in serving the requests, process it internally, and once the process finished, results in the Event.

Sometimes, "(?)" could also communicate with other business capability provider, or external system with the Event as an outcome.

### Technical Implementation

From a technical viewpoint, we can adopt modern cloud-native patterns to implement this event-driven architecture:

#### **Event-Driven Architecture with Amazon EventBridge**
- **Event Publishing**: Microservices publish domain events to Amazon EventBridge
- **Event Consumption**: Other services subscribe to relevant events for loose coupling
- **Event Routing**: EventBridge routes events based on content and rules

#### **Microservices on Amazon EKS**
- **Container Orchestration**: Services run as containers on Kubernetes (EKS)
- **Service Communication**: Asynchronous via EventBridge, synchronous via REST APIs
- **Scalability**: Horizontal Pod Autoscaler (HPA) for automatic scaling

#### **Modern Implementation Stack**
- **Runtime**: Java 21 + Spring Boot 3.4.1
- **Architecture**: Hexagonal Architecture with DDD patterns
- **Data Storage**: Amazon DynamoDB for each bounded context
- **Event Bus**: Amazon EventBridge for domain event propagation
### Exceptions or risky events

Throughout the events exploration journey, there will be many different sticky notes pasted on the wall and not all events will have a smooth flow.

To do it in a cost-effective way, take the most risky journey and explore the exceptions. You can find more events from this and extend the journey to enrich the business flow.

### Re-think solutions to serve risky events

Represent these failure scenarios with red sticky notes. For example, think about the consequences in the business flow in the coffee shop scenario.

* What if the customer ordered coffee without giving a table number?
* What if the barista made a wrong order?

![](../img/coffee-shop-risk-v2.png)

Regardless if it's a failure or mistake, the customer experience will be impacted. There is a need to re-think about these issues to sieve out further actions to prevent or solve these issues.

Although not essential, this step could help you to **handle business scenario which you were not familiar with before.**

Replay the scenarios forward and back, each time dropping off some of the questions, risk or exceptions posted and the pieces will start to grow into a more elaborate story.

### Aggregate

Until now, you may have realized that the central element "(?)" provides business capability and owns the responsibility to accept or reject *Commands* from the *Role*. This is called **"Aggregate"**.

However, at the early stage, encourage participants to focus on gathering *Events* and *Commands*. Focus more on building the relationship between these objects. An Aggregate will usually create the most confusion as participants try to grasp its concept. Try to pin them on a yellow sticker and leave the name empty at the moment, maybe just mark it as a **question mark**. Try to defer naming until team has fully knowledge of the domain.

### Aggregate Naming

> Another example for IT guy outsourcing, project management

![](../img/itguy-outsourcing.png)

*Aggregates* are logical groups of *Commands* and *Events* that make sense to think about them as a single unit within the business process.

With more of the scenarios being played out, the name for the Aggregate should fall in place naturally.

Here are some examples of Aggregate naming convention:
* By Nouns
* By Gerunds (Verb with - ing)

No matter which convention you favor, remember to present the **"ability"** of the aggregate, that means traverse each *Command* the *Aggregate* is received, and make sure each event occurred is reasonable.

### Bounded Context forming up

With more and more Aggregates being captured, you may find that several Aggregates are cohesive, others are not. There is a simple pattern to help you form up the boundary to have a clear bounded context.

- Command A is fired and it causes Event A
- Event A provides information View A
- View A is also needed while doing a condition that uses Command B
- Command A and Command B  might be good to be in one module together

**Circle these cohesive aggregates together, the boundary is naturally established.**

![](../img/bcmapping.png)

While you figure out several bounded contexts, there are some co-relationships between each other, some bounded context play the upstream role, some of these play the downstream role. From **Eric Evans'** perspective, there are 9 types of corelationships.

![](../img/legacy-bc.png)

> Context Maps could reflect the collaborative or even organizational teams' relationships between different Bounded Contexts in your systems.

It is sometimes worth to do a "Bounded Context Mapping" which can uncover what are some of the dependencies, what's the impact scope when upstream (e.g. API contract) has changes, and how to prevent harmful downstream impact of it.

> Recommend to read [Bounded Context Mapping - by Domain Driven Design Taiwan Community - Eason Kuo](https://www.slideshare.net/YiChengKuo1/implementing-domaindriven-design-study-group-chapter-3-context-maps) for more details.

## 🏗️ From Domain Design to Cloud-Native Implementation

Now that we've identified the domain boundaries and event flows, let's see how these concepts translate into our modern cloud-native architecture:

### **Domain to Microservice Mapping**

#### **Identified Bounded Contexts → EKS Microservices**
- **Order Context** → `orders-web` service (Spring Boot on EKS)
- **Coffee Context** → `coffee-web` service (Spring Boot on EKS)  
- **Inventory Context** → `inventory-web` service (Spring Boot on EKS)

#### **Domain Events → EventBridge Events**
- **OrderCreated** → Published to EventBridge when order is placed
- **CoffeeRequested** → Triggers coffee preparation workflow
- **InventoryUpdated** → Updates stock levels across services

#### **Aggregates → Microservice Boundaries**
Each aggregate becomes a microservice with its own:
- **Database**: DynamoDB table for data persistence
- **API**: REST endpoints for external communication
- **Event Handlers**: Subscribers for relevant domain events

### **Cloud-Native Architecture Benefits**

#### **Scalability**
- **Horizontal Scaling**: Each microservice scales independently based on load
- **Auto-scaling**: Kubernetes HPA adjusts replicas automatically
- **Resource Efficiency**: ARM64 Graviton3 instances for cost optimization

#### **Resilience**
- **Fault Isolation**: Failure in one service doesn't affect others
- **Circuit Breakers**: Prevent cascade failures between services
- **Health Checks**: Kubernetes monitors and restarts unhealthy pods

#### **Event-Driven Benefits**
- **Loose Coupling**: Services communicate via events, not direct calls
- **Eventual Consistency**: Each service maintains its own data consistency
- **Audit Trail**: EventBridge provides complete event history

Next, let's look at how we can translate all these domain concepts into actual code and deployment.

[Next: 04 Modeling and Development >](../04-modeling-and-development/README.md)
