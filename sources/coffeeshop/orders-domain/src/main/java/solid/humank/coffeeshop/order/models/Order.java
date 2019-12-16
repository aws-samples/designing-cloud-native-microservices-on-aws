/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except
 * in compliance with the License. A copy of the License is located at
 *
 * http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

package solid.humank.coffeeshop.order.models;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import solid.humank.coffeeshop.order.commands.ChangeItem;
import solid.humank.coffeeshop.order.commands.CreateOrder;
import solid.humank.coffeeshop.order.domainevents.OrderCreated;
import solid.humank.coffeeshop.order.domainevents.OrderItemsChanged;
import solid.humank.coffeeshop.order.domainevents.OrderStatusChanged;
import solid.humank.coffeeshop.order.exceptions.AggregateException;
import solid.humank.coffeeshop.order.exceptions.StatusTransitionException;
import solid.humank.coffeeshop.order.policies.OrderPolicy;
import solid.humank.coffeeshop.order.specifications.StatusTransitionSpec;
import solid.humank.ddd.commons.baseclasses.AggregateRoot;
import solid.humank.ddd.commons.baseclasses.DomainEvent;
import solid.humank.ddd.commons.baseclasses.Specification;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RegisterForReflection
public class Order extends AggregateRoot<OrderId> {

    final static Logger logger = LoggerFactory.getLogger(Order.class);
    final static String DATE_FORMAT = "yyyyMMddHHmmss";


    @Getter
    @Setter(AccessLevel.PRIVATE)
    private String tableNo;


    @Getter
    @Setter(AccessLevel.PRIVATE)
    private OrderStatus status;


    @Getter
    @Setter(AccessLevel.PRIVATE)
    private List<OrderItem> orderItems;
    @Getter
    @Setter(AccessLevel.PRIVATE)
    private OffsetDateTime createdDate;
    @Getter
    @Setter(AccessLevel.PRIVATE)
    private OffsetDateTime modifiedDate;


    public Order() {
        this.setId(new OrderId());
        this.tableNo = "";
        this.status = OrderStatus.INITIAL;
        this.orderItems = new ArrayList<>();
        this.createdDate = OffsetDateTime.now();

    }

    public Order(OrderId orderId, String tableNo, OrderStatus status, List<OrderItem> orderItems, OffsetDateTime createdDate, OffsetDateTime modifiedDate) {
        this.setId(orderId);
        this.tableNo = tableNo;
        this.status = status;
        this.orderItems = orderItems;
        this.createdDate = createdDate;
        this.modifiedDate = modifiedDate;
    }

    public Order(OrderId orderId, String tableNo, OrderStatus status, List<OrderItem> items, OffsetDateTime createdDate) {
        this.setId(orderId);
        this.tableNo = tableNo;
        this.status = status;
        this.orderItems = items;
        this.createdDate = createdDate;
    }

    /**
     * This is a static factory method to obtain Entity based on historical domain events. Good to Event-Soucring architecture usage.
     * By traversing each historical domain event, and replay each event handler.
     *
     * @param events
     * @return
     */
    public static Order reBuild(List<DomainEvent<OrderId>> events) {

        //TODO : implement in java8 syntax.
        return null;
    }

    public static Order create(CreateOrder cmd) throws AggregateException {

        Order order =
                new Order(cmd.getId(), cmd.getTableNo(), cmd.getStatus(), cmd.getItems(), OffsetDateTime.now());
        OrderPolicy.Verify(order);

        OrderCreated orderCreated =
                new OrderCreated(order.getId(), order.tableNo, order.orderItems, order.createdDate);

        order.applyEvent(orderCreated);
        return order;
    }

    public BigDecimal totalFee() {
        return this.getOrderItems()
                .stream()
                .map(orderItem -> orderItem.fee())
                .reduce(BigDecimal.ZERO, (b1, b2) -> b1.add(b2));
    }

    public void changeItem(ChangeItem cmd) {
        if (cmd.getItems() == null || cmd.getItems().isEmpty()) return;
        Stream<OrderItem> combinedStream = Stream.concat(this.orderItems.stream(), cmd.getItems().stream());

        List<OrderItem> newItemList = combinedStream.collect(Collectors.toList());
        this.orderItems.clear();
        this.orderItems.addAll(newItemList);
        this.modifiedDate = OffsetDateTime.now();

        this.applyEvent(new OrderItemsChanged(this.getId(), cmd.getItems(), this.modifiedDate));
    }

    public void process() throws StatusTransitionException {
        OrderStatus status = OrderStatus.PROCESSING;
        this.verifyStatus(OrderStatus.INITIAL, status);
        this.changeStatus(status);
    }

    private void changeStatus(OrderStatus status) {
        OrderStatus originalStatus = this.status;
        this.status = status;
        this.modifiedDate = OffsetDateTime.now();

        this.applyEvent(new OrderStatusChanged(this.getId(), originalStatus, status, this.modifiedDate));

    }

    private void verifyStatus(OrderStatus previousStatus, OrderStatus targetStatus) throws StatusTransitionException {
        if (this.status == targetStatus) return;

        Specification specification = new StatusTransitionSpec(this.status, previousStatus, targetStatus);
        if (specification.isSatisfy() == false) {
            String errorMessage = String.format("Cant not transit order status from %s to %s", status, targetStatus);
            throw new StatusTransitionException(errorMessage);
        }
    }

    public void deliver() throws StatusTransitionException {
        OrderStatus status = OrderStatus.DELIVER;
        this.verifyStatus(OrderStatus.PROCESSING, status);
        this.changeStatus(status);

    }

    public void closed() throws StatusTransitionException {
        OrderStatus status = OrderStatus.CLOSED;
        this.verifyStatus(OrderStatus.DELIVER, status);
        this.changeStatus(status);
    }

    public void cancel() throws StatusTransitionException {
        this.changeStatus(OrderStatus.CANCEL);
    }

    public void when(OrderCreated event) {

        this.setId(event.getEntityId());
        this.tableNo = event.getTableNo();
        this.status = OrderStatus.INITIAL;
        this.orderItems = event.getOrderItems();
        this.createdDate = event.getCreatedDate();
    }

    public void when(OrderStatusChanged event) throws StatusTransitionException {
        this.suppressEvent();
        switch (event.getCurStatus()) {
            case PROCESSING:
                this.process();
                break;

            case DELIVER:
                this.deliver();
                break;

            case CLOSED:
                this.closed();
                break;

            case CANCEL:
                this.cancel();
                break;
        }
        this.unSuppressedEvent();
    }

    public String createdDateString() {
        return createdDate.format(DateTimeFormatter.ofPattern(DATE_FORMAT));
    }

    public String modifiedDateString() {
        return
                modifiedDate == null ? "N/A" : modifiedDate.format(DateTimeFormatter.ofPattern(DATE_FORMAT));
    }


}
