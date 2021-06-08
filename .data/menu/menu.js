const menuItems = {
  flavor: [
    { type: 'bbq chicken', price: 5 },
    { type: 'hawaian', price: 3.5 },
    { type: 'margherita', price: 4.5 },
    { type: 'meat', price: 5.5 },
    { type: 'pepperoni', price: 5 },
    { type: 'supreme', price: 5 },
  ],
  crust: [
    { type: 'cheese stuffed', price: 1 },
    { type: 'deep dish', price: 2 },
    { type: 'neapoliton', price: 1.5 },
    { type: 'original', price: 0 },
    { type: 'sicilian style', price: 2 },
    { type: 'thin', price: 0 },
  ],
  toppings: [
    {
      cheeses: [
        { type: 'blue cheese', price: 0.5 },
        { type: 'mozarella', price: 0.75 },
        { type: 'parmessan', price: 1 },
      ],
      meats: [
        { type: 'anchovies', price: 0.5 },
        { type: 'bacon', price: 0.75 },
        { type: 'turkey', price: 1 },
        { type: 'ham', price: 1 },
      ],
      vegetables: ['olives', 'mushrooms', 'onions', 'garlic'],
    },
  ],
};

module.exports = menuItems;
