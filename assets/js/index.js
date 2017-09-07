const {remote} = require('electron');
const app = angular.module('app', ['ngRoute', 'angucomplete']);
const db = require('diskdb').connect(__dirname+'/store', ['products','sales','settings']);

app.config(($routeProvider)=>{
  $routeProvider
  .when('/', {
    templateUrl: __dirname+'/assets/components/dashboard/index.html',
    controller:'dashboardController'
  })
  .when('/pos', {
    templateUrl: __dirname+'/assets/components/pos/index.html',
    controller:'posController'
  })
  .when('/inventory', {
    templateUrl: __dirname+'/assets/components/inventory/index.html',
    controller:'inventoryController'
  })
  .when('/config', {
    templateUrl: __dirname+'/assets/components/config/index.html',
    controller:'configController'
  })
  .when('/feedback', {
    templateUrl: __dirname+'/assets/components/feedback/index.html',
    controller:'feedbackController'
  });
});

app.controller('navController', function($scope){
  let window = remote.getCurrentWindow();
  $scope.close = () => {
    window.close();
  };
});

app.controller('dashboardController', function($scope){
  $scope.testing = () => {
    alert("dashboard");
  };
});

app.controller('posController', function($scope){
  $scope.inventories = [
    {id:"123", name:"name1", stock:"30", base_price:"20000", sell_price:30000, updatedAt:"10000"},
    {id:"123", name:"name2", stock:"30", base_price:"20000", sell_price:30000, updatedAt:"10000"},
    {id:"123", name:"name3", stock:"30", base_price:"20000", sell_price:30000, updatedAt:"10000"},
    {id:"123", name:"name4", stock:"30", base_price:"20000", sell_price:30000, updatedAt:"10000"},
    {id:"123", name:"name5", stock:"30", base_price:"20000", sell_price:30000, updatedAt:"10000"},
    {id:"123", name:"name6", stock:"30", base_price:"20000", sell_price:30000, updatedAt:"10000"},
    {id:"123", name:"name7", stock:"30", base_price:"20000", sell_price:30000, updatedAt:"10000"},
  ];
  $scope.cart = [];
  $scope.totalPrice = 0;
  $scope.inventories.forEach((x,i)=>{$scope.cart[i]={active:false, qt:0, price:0};});
  $scope.testing = () => {
    alert("pos");
  };
  $scope.addToCart = (i) => {
    $scope.cart[i].active=true;
    $scope.cart[i].price=$scope.inventories[i].sell_price;
    $scope.cart[i].qt=1;
    $scope.updateTotal();
  };
  $scope.removeItem = (i) => {
    $scope.cart[i].active=false;
    $scope.cart[i].price=0;
    $scope.cart[i].qt=0;
    $scope.updateTotal();
  };
  $scope.updatePrice = (i,name) =>{
    $scope.cart[i].qt=angular.element('#'+name).val();
    $scope.cart[i].price=$scope.cart[i].qt*$scope.inventories[i].sell_price;
    $scope.updateTotal();
  };
  $scope.getValForm = (i) => {
    return angular.element('#'+i).val();
  };
  $scope.updateTotal = () => {
    $scope.totalPrice = $scope.cart.reduce((total, x)=>{return total+x.price;},0);
  };
});

app.controller('inventoryController', function($scope){
  $scope.products = [
    {id:"123", name:"name1", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name2", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name3", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name4", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name5", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name6", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name7", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
  ];
  $scope.addNewProduct = () => {
    console.log('test')
  };
});

app.controller('configController', function($scope){
  $scope.testing = () => {
    alert("config");
  };
});

app.controller('feedbackController', function($scope){
  $scope.testing = () => {
    alert("feedback");
  };
});
