const {remote} = require('electron');
const app = angular.module('app', ['ngRoute', 'angucomplete']);
const Datastore = require('nedb')
  , products = new Datastore({ filename: '../store/products.db', autoload:true });
products.loadDatabase(function (err) {
});

const fs = require('fs');

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

  loadProducts().then((products)=>{
    document.getElementById('spinner').style.display = 'none';
    $scope.products=products;
    $scope.$apply();
  }).catch((err)=>{
    if(err) console.log(err);
  });

  document.getElementById("image").addEventListener('change', function(){
    if(this.files[0]){
      $scope.image=this.files[0];
    }
  });

  $scope.addNewProduct = () => {
    let obj = $scope.products.find(o => o.name === angular.element('#newProduct_value').val());
    let doUpdate = obj ? true : false;

    if(angular.element('#newProduct_value').val()!==""&&
    angular.element('#quantity').val()!==""&&
    angular.element('#base_price').val()!==""&&
    angular.element('#sell_price').val()!==""){
      $scope.newProduct = {};

      if(doUpdate&&!$scope.image)
        $scope.newProduct.imagePath = obj.imagePath;
      else if(!doUpdate&&!$scope.image)
        $scope.newProduct.imagePath = __dirname+'/assets/images/70x50.png';
      else
        $scope.newProduct.imagePath = __dirname+'/assets/images/'+Date.parse(new Date)+$scope.image.name;

      $scope.newProduct.base_price = angular.element('#basePrice').val();
      $scope.newProduct.name = angular.element('#newProduct_value').val();
      $scope.newProduct.quantity = angular.element('#quantity').val();
      $scope.newProduct.sell_price = angular.element('#sellPrice').val();
      $scope.newProduct.status = true;
      $scope.newProduct.createdAt = new Date().toISOString().substring(0,10);
      $scope.newProduct.updatedAt = $scope.newProduct.createdAt;

      if(obj){
        //update product
        let newObj = {
          'name':$scope.newProduct.name,
          'quantity':Number($scope.newProduct.quantity)+Number(obj.quantity),
          'base_price':$scope.newProduct.base_price,
          'sell_price':$scope.newProduct.sell_price,
          'updatedAt':new Date().toISOString().substring(0,10),
        };
        if($scope.image){
          fs.writeFileSync($scope.newProduct.imagePath, fs.readFileSync($scope.image.path));
          newObj.imagePath = $scope.newProduct.imagePath;
        }
        updateProduct(obj._id, newObj).then((result)=>{
          $scope.products.forEach((x)=>{
            if(x._id === obj._id){
              x.quantity=newObj.quantity;
              x.base_price=newObj.base_price,
              x.sell_price=newObj.sell_price,
              x.updatedAt=newObj.updatedAt
            }
          });
        });
      }else{
        // add new product
        if($scope.image)
          fs.writeFileSync($scope.newProduct.imagePath, fs.readFileSync($scope.image.path));

        products.insert($scope.newProduct, (err, newProduct) => {
          if(err) console.log(err);
          $scope.products.push(newProduct);
        });
      }
      angular.element("#cancel-btn").click();
    }
    angular.element('#newProduct_value').focus();
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


let loadProducts = () =>{
  return new Promise((resolve, reject)=>{
    products.find({}, (err, products) => {
      if(err) reject(err);
      resolve(products);
    });
  });
}

let updateProduct  = (id, newObj) => {
  return new Promise((resolve, reject) => {
    products.update({'_id':id}, newObj, {}, (err, updatedProduct)=>{
      if(err) reject(err);
      resolve(updatedProduct);
    });
  });
}
