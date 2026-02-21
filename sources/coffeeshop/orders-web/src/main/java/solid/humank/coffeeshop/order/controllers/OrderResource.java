package solid.humank.coffeeshop.order.controllers;

import solid.humank.coffeeshop.order.applications.CreateOrderSvc;
import solid.humank.coffeeshop.order.datacontracts.messages.CreateOrderMsg;
import solid.humank.coffeeshop.order.datacontracts.results.OrderItemRst;
import solid.humank.coffeeshop.order.datacontracts.results.OrderRst;
import solid.humank.coffeeshop.order.exceptions.AggregateException;
import solid.humank.ddd.commons.interfaces.rest.CommonResponse;
import solid.humank.coffeeshop.order.models.requests.AddOrderReq;
import solid.humank.coffeeshop.order.models.requestsmodels.OrderItemRM;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/order")
public class OrderResource {

    @Autowired
    CreateOrderSvc service;

    public OrderResource() {
    }

    @PostMapping
    public ResponseEntity<CommonResponse> createOrder(@RequestBody AddOrderReq request) {

        CreateOrderMsg cmd = new CreateOrderMsg("0", this.transformToOrderItemVM(request.getItems()));

        OrderRst orderRst = null;
        String err = null;

        try {
            orderRst = service.establishOrder(cmd);
        } catch (AggregateException e) {
            e.printStackTrace();
            err = e.getMessage();
        }

        if (err == null) {
            return ResponseEntity.status(201).body(new CommonResponse(orderRst));
        }
        return ResponseEntity.badRequest().body(new CommonResponse(err));
    }

    private List<OrderItemRst> transformToOrderItemVM(List<OrderItemRM> items) {
        List<OrderItemRst> result = new ArrayList<>();
        items.forEach(orderItemRM -> {
            result.add(new OrderItemRst(orderItemRM.getProductId(), orderItemRM.getQty(), orderItemRM.getPrice()));
        });

        return result;
    }
}
