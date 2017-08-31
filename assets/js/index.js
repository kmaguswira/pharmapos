const {remote} = require('electron');
const app = angular.module('app', ['ngRoute']);

console.log('start');

app.config(($routeProvider)=>{
  console.log('0');
  $routeProvider.when('/', {
    templateUrl: __dirname+'/assets/components/home/home.html',
    controller:'homeController'
  });
});

app.controller('navController', ($scope)=>{
  console.log("1")
  let window = remote.getCurrentWindow();
  $scope.close = () => {
    console.log("2");
    window.close();
  };
});

app.controller('homeController', ($scope)=>{

});
