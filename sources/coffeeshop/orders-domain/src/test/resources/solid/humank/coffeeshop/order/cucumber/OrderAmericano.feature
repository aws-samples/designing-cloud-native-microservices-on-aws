Feature: Order Americano in seat

  Scenario: Drink Americano, stay in
    Given customer wants to order coffee with the following detail
      | coffee    | quantity | price |
      | Americano | 2        | 80    |
    When the order is confirmed
    Then the total fee should be 160l


