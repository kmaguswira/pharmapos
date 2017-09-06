const {remote} = require('electron');
const app = angular.module('app', ['ngRoute']);

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
  $scope.testing = () => {
    alert("pos");
  };
  $scope.addToCart = (i) => {
    console.log($scope.inventories[i]);
  };
  $scope.inventories = [
    {id:"123", name:"name1", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name2", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name3", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name4", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name5", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name6", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name7", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
  ];
});

app.controller('inventoryController', function($scope){
  $scope.testing = () => {
    alert("inventory");
  };
  $scope.inventories = [
    {id:"123", name:"name1", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name2", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name3", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name4", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name5", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name6", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
    {id:"123", name:"name7", stock:"30", base_price:"20000", sell_price:"30000", updatedAt:"10000"},
  ];
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
