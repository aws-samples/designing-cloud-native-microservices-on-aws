# Designing Cloud Native Microservices on AWS  (via DDD/EventStormingWorkshop)

![](docs/img/coffee.jpg)
_Picture license-free from [Pexels](https://www.pexels.com/photo/background-beverage-breakfast-brown-414645/)_

Building software is hard. Understanding the business needs of the software is even harder. In almost every software development project, there will always be some form of gap between the requirements of the business users and the actual implementation.

As a developer, knowing how to narrow this gap can help you go a long way to building applications that are relevant for the users. Using a Domain Driven Design approach, delivered via Event Storming, it can help to reduce the time it takes for everyone in the project team to understand a business domain model.



> Theory and Practice: Learning in the Real world cases

**Go through all of the learning journey, develop-->build-->deploy artifacts on AWS**

![](docs/img/Coffeeshop-architecture.png)





## Table of Contents
- [00 - Event Storming](#eventstorming)
  - [What is Event Storming?](#what-is-event-storming)
  - [Whom is it for?](#whom-is-it-for)
  - [Event Storming Terms](#event-storming-terms)
  - [Event Storming Benefits](#event-storming-benefits)
  - [Event Storming Applications](#event-storming-applications)
- [01 - Hands-on: Events exploring](docs/01-hands-on-events-exploring/README.md)
- [02 - Cafe business scenario](docs/02-coffee-shop-scenario/README.md)
- [03 - Roles, Commands, and Events Mapping](docs/03-roles-commands-events-mapping/README.md)
  - [Key Business events in the coffeeshop](docs/03-roles-commands-events-mapping/README.md#key-business-events-in-the-coffeeshop)
  - [Commands and Events mapping](docs/03-roles-commands-events-mapping/README.md#commands-and-events-mapping)
  - [Roles](docs/03-roles-commands-events-mapping/README.md#roles)
  - [Exceptions or risky events](docs/03-roles-commands-events-mapping/README.md#exceptions-or-risky-events)
  - [Re-think solutions to serve risky events](docs/03-roles-commands-events-mapping/README.md#re-think-solutions-to-serve-risky-events)
  - [Aggregate](docs/03-roles-commands-events-mapping/README.md#aggregate)
  - [Bounded Context forming up](docs/03-roles-commands-events-mapping/README.md#bounded-context-forming-up)
- [04 - Modeling and Development](docs/04-modeling-and-development/README.md)
  - [Specification by Example](docs/04-modeling-and-development/README.md#specification-by-example)
  - [TDD within Unit Test environment](docs/04-modeling-and-development/README.md#tdd-within-unit-test-environment)
  - [Generate unit test code skeleton](docs/04-modeling-and-development/README.md#generate-unit-test-code-skeleton)
  - [Implement Domain Model from code Skeleton](docs/04-modeling-and-development/README.md#implement-domain-model-from-code-skeleton)
  - [Design each Microservices in Port-adapter concept](docs/04-modeling-and-development/README.md#design-each-microservices-in-port-adapter-concept)
- [05 - Deploy Applications by AWS CDK](docs/05-deploy-applications-by-cdk/README.md) 
<!---
- [05 - Domain Driven Design Tactical design pattern guidance](05-ddd-tactical-design-pattern)
- [06 - Actual Implementation](06-actual-implementation)
- [07 - Infrastructure as Code by CDK](07-iaac-cdk)
- [08 - Deploy Serverless application](08-deploy-serverless-app)
- [09 - Deploy Containerized application](09-deploy-containerized-app)
- [10 - Build up CI/CD pipeline](10-build-up-cicd-pipeline)
--->

# Event Storming
![image](docs/img/problemsolving.png)

## What is Event Storming?
Event Storming is a **rapid**, **lightweight**, and often under-appreciated group modeling technique invented by Alberto Brandolini, that is **intense**, **fun**, and **useful** to **accelerate** project teams. It is typically offered as an interactive **workshop** and it is a synthesis of facilitated group learning practices from Gamestorming, leveraging on the principles of Domain Driven Design (DDD).

You can apply it practically on any technical or business domain, especially those that are large, complex, or both.

## Whom is it for?
Event Storming isn't limited to just for the software development team. In fact, it is recommend to invite all the stakeholders, such as developers, domain experts, business decision makers etc to join the Event Storming workshop to collect viewpoints from each participants.

## Event Storming Terms

![Event Storming](https://storage.googleapis.com/xebia-blog/1/2018/10/From-EventStorming-to-CoDDDing-New-frame-3.jpg)

> Reference from Kenny Bass - https://storage.googleapis.com/xebia-blog/1/2018/10/From-EventStorming-to-CoDDDing-New-frame-3.jpg

Take a look on this diagram, there are a few colored sticky notes with different intention:

* **Domain Events** (Orange sticky note) - Describes *what happened*. Represent facts that happened in a specific business context, written in past tense
* **Actions** aka Command (Blue sticky note) - Describes an *action* that caused the domain event. It is a request or intention, raised by a role or time or external system
* **Information** (Green sticky note) - Describes the *supporting information* required to help make a decision to raise a command
* **Consistent Business Rules** aka Aggregate (Yellow sticky note)
    * Groups of Events or Actions that represent a specific business capability
    * Has the responsibility to accept or fulfill the intention of command
    * Should be in small scope
    * And communicated by eventual consistency
* **Eventual Consistent Business rules** aka Policy (Lilac sticky note)
    * Represents a process or business rules. Can come from external regulation and restrictions e.g. account login success/fail process logic.

## Event Storming Benefits

Business requirements can be very complex. It is often hard to find a fluent way to help the Product Owner and Development teams to collaborate effectively. Event storming is designed to be **efficient** and **fun**. By bringing key stakeholder into the same room, the process becomes:

- **Efficient:** Everyone coming together in the same room can make decisions and sort out differences quickly. To create a comprehensive business domain model, what used to take many weeks of email, phone call or meeting exchanges can be reduced to a single workshop.

- **Simple:** Event Storming encourages the use of "Ubiquitous language" that both the technical and non-technical stakeholders can understand.

- **Fun:** Domain modeling is fun! Stakeholders get hands-on experience to domain modeling which everyone can participate and interact with each other. It also provides more opportunities to exchange ideas and improve mindsharing, from various perspective across multiple roles.

- **Effective:** Stakeholders are encouraged not to think about the data model, but about the business domain. This puts customers first and working backwards from there, achieves an outcome that is more relevant.

- **Insightful:** Event Storming generate conversations. This helps stakeholders to understand the entire business process better and help to have a more holistic view from various perspective.

## Event Storming Applications

There are many useful applications of Event Storming. The most obvious time to use event storming is at a project's inception, so the team can start with a common understanding of the domain model. Some other reasons include:
* Discovering complexity early on, finding missing concepts, understanding the business process;
* Modelling or solving a specific problem in detail;
* Learning how to model and think about modelling.

Event Storming can also help to identify key views for your user interface, which can jump start Site Mapping or Wireframing.

Let's get started with a quick example to demonstrate how to run a simple Event Storming.

[Next: 01 Hands-on Events Exploring >](docs/01-hands-on-events-exploring/README.md)


## License

This library is licensed under the MIT-0 License. See the LICENSE file.
