const {remote} = require('electron');
const app = angular.module('app', ['ngRoute', 'angucomplete']);
const Datastore = require('nedb')
  , products = new Datastore({ filename:'../store/products.db', autoload:true })
  , sales = new Datastore({ filename:'../store/sales.db', autoload:true})
  , orders = new Datastore({ filename:'../store/orders.db', autoload:true});
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
  loadProducts({}).then((products)=>{
    document.getElementById('spinner').style.display = 'none';
    $scope.inventories=products.filter(x=>x.status==true);
    $scope.cart = [];
    $scope.sales = [];
    $scope.orders = [];
    $scope.totalPrice = 0;
    $scope.inventories.forEach((x,i)=>{$scope.cart[i]={id:x._id, name:x.name, sell_price:x.sell_price, active:false, qt:0, price:0};});
    $scope.$apply();
  }).catch((err)=>{
    if(err) console.log(err);
  });
  $scope.loadSales = () => {
    new Promise((resolve, reject)=>{
      sales.find({}).sort({date:-1}).exec((err, lists)=>{
        if(err) reject(err);
        resolve(lists);
      });
    }).then((data)=>{
      document.getElementById('spinner-salesHistory').style.display = 'none';
      $scope.$apply(()=>{
        $scope.sales = data;
      });
    }).catch((err)=>{
      console.log(err)
    });
  };
  $scope.loadOrders = () => {
    new Promise((resolve, reject)=>{
      orders.find({}).sort({createdAt:-1}).exec((err, lists)=>{
        if(err) reject(err);
        resolve(lists);
      });
    }).then((data)=>{
      document.getElementById('spinner-ordersHistory').style.display = 'none';
      $scope.$apply(()=>{
        $scope.orders = data;
        console.log($scope.orders)
      });
    }).catch((err)=>{
      console.log(err);
    });
  }
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
    $scope.cart[i].price=Number($scope.cart[i].qt)*Number($scope.inventories[i].sell_price);
    $scope.updateTotal();
  };
  $scope.getValForm = (i) => {
    return angular.element('#'+i).val();
  };
  $scope.updateTotal = () => {
    $scope.totalPrice = $scope.cart.reduce((total, x)=>{return Number(total)+Number(x.price);},0);
  };
  $scope.checkOut  = () => {
    $scope.cart.forEach((x,i)=>{
      if(x.active){
        $scope.inventories[i].quantity = Number($scope.inventories[i].quantity)-Number(x.qt);
        products.update({'_id':x.id}, {
          'name':$scope.inventories[i].name,
          'quantity':$scope.inventories[i].quantity,
          'base_price':$scope.inventories[i].base_price,
          'sell_price':$scope.inventories[i].sell_price,
          'imagePath':$scope.inventories[i].imagePath,
          'status':$scope.inventories[i].status,
          'createdAt':$scope.inventories[i].createdAt,
          'updatedAt':$scope.inventories[i].updatedAt
        }, {}, (err,x)=>{
          if(err) console.log(err);
          console.log('updated', x);
        });
      }
    });
    sales.insert({
                  'createdAt':new Date().toISOString().substring(0,10),
                  'totalPrice':$scope.totalPrice,
                  'orders':$scope.cart.filter(x=>x.active===true)
                },
    (err, newSale) => {
      if(err) console.log(err);
    });

    console.log($scope.cart);
    $scope.cart = [];
    $scope.totalPrice = 0;
  };
  $scope.showDetailSale = (i) =>{
    if(document.getElementById(i).style.display === 'none'){
      document.getElementById(i).style.display='table-row';
    }else{
      document.getElementById(i).style.display='none';
    }
  }
  $scope.showDetailOrder = (i) =>{
    console.log(1)
    if(document.getElementById(i).style.display === 'none'){
      console.log(2)
      document.getElementById(i).style.display='table-row';
    }else{
      document.getElementById(i).style.display='none';
    }
  }
});

app.controller('inventoryController', function($scope){

  loadProducts({}).then((products)=>{
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
          'name':obj.name,
          'quantity':Number($scope.newProduct.quantity)+Number(obj.quantity),
          'base_price':$scope.newProduct.base_price,
          'sell_price':$scope.newProduct.sell_price,
          'imagePath':obj.imagePath,
          'status':obj.status,
          'createdAt':obj.createdAt,
          'updatedAt':new Date().toISOString().substring(0,10),
        };

        if($scope.image){
          fs.writeFileSync($scope.newProduct.imagePath, fs.readFileSync($scope.image.path));
          newObj.imagePath = $scope.newProduct.imagePath;
        }
        updateProduct(obj._id, newObj).then((result)=>{
          orders.update({'date':new Date().toISOString().substring(0,10)},{
            $push:{'items':{
              'id':obj._id,
              'name':obj.name,
              'base_price':$scope.newProduct.base_price,
              'quantity':$scope.newProduct.quantity,
              'totalPrice':Number($scope.newProduct.base_price)*Number($scope.newProduct.quantity),
              'is_new':false
            }}
          }, {'upsert':true}, (err)=>{
            if(err) console.log(err);
            console.log('order created');
          });
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
          orders.update({'date':new Date().toISOString().substring(0,10)},{
            $push:{'items':{
              'id':newProduct._id,
              'name':newProduct.name,
              'base_price':$scope.newProduct.base_price,
              'quantity':$scope.newProduct.quantity,
              'totalPrice':Number($scope.newProduct.base_price)*Number($scope.newProduct.quantity),
              'is_new':true
            }}
          }, {'upsert':true}, (err)=>{
            if(err) console.log(err);
            console.log('order created');
          });
          $scope.products.push(newProduct);
        });
      }
      angular.element("#cancel-btn").click();
    }
    angular.element('#newProduct_value').focus();
  };

  $scope.activeOrDeactive = (id) => {
    $scope.products.forEach((x)=>{
      if(x._id === id){
        if(x.status)
          x.status = false;
        else
          x.status = true;
        products.update({'_id':id}, {
          'name':x.name,
          'quantity':x.quantity,
          'base_price':x.base_price,
          'sell_price':x.sell_price,
          'imagePath':x.imagePath,
          'status':x.status,
          'createdAt':x.createdAt,
          'updatedAt':new Date().toISOString().substring(0,10)
        }, {}, (err)=>{
          if(err) console.log(err);
        });
      }
    });
  }
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


let loadProducts = (query) =>{
  return new Promise((resolve, reject)=>{
    products.find(query, (err, products) => {
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
