# Lombok Setter Issue Explanation

## Issue
The error message `cannot find symbol symbol: method setAbbr(java.lang.String)` occurs because the code is trying to call `setAbbr()` directly on the `Order` class, but the `abbr` field is actually defined in the `EntityId` class.

## Code Structure
- `Order` extends `AggregateRoot<OrderId>`
- `OrderId` extends `EntityId`
- The `abbr` field is defined in `EntityId`

## Solution
Instead of trying to set the `abbr` directly on the `Order` class, you should:

1. Set the `abbr` when creating a new `OrderId`:
```java
OrderId orderId = new OrderId(seqNo, createdDate); // The abbr is set in the constructor of EntityId
```

2. Or, if you need to modify an existing OrderId's abbr, you should access it through the proper entity hierarchy:
```java
// Assuming you have an Order instance called 'order'
OrderId orderId = order.getId(); // Get the OrderId
// Then work with the OrderId instance
```

## Note
Adding `@Setter` to the `Order` class won't solve this issue because the field doesn't belong to the `Order` class. The proper way is to handle the `abbr` field through the `OrderId` class which extends `EntityId` where the field is actually defined.