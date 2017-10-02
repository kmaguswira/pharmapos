const {remote} = require('electron');
const app = angular.module('app', ['ngRoute', 'angucomplete']);
const Datastore = require('nedb')
  , products = new Datastore({ filename:'./store/products.db', autoload:true })
  , sales = new Datastore({ filename:'./store/sales.db', autoload:true})
  , orders = new Datastore({ filename:'./store/orders.db', autoload:true})
  , statistics = new Datastore({ filename:'./store/statistics.db', autoload:true});
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
  $scope.notifications=[];
  $scope.top5Sales=[];
  $scope.top5Revenue=[];

  $scope.testing = () => {
    alert("dashboard");
  };
  $scope.loadNotif = () => {
    let getNotif = loadProducts({"quantity":{$lte:10}})
    getNotif.then((data)=>{
      data.forEach(x=>{
        if(x.quantity==0){
          x.nofStat = 'Danger!';
          x.nofMsg = 'Out of stock, please restock'
        }else{
          x.nofStat = 'Warning!';
          x.nofMsg = 'Almost out of stock'
        }
      });
      $scope.$apply(()=>{
        $scope.notifications = data;
        // console.log($scope.notifications)
      })
    }).catch((err)=>{
      console.log(err);
    })
  }
  $scope.loadStatistic = () => {
    new Promise((resolve, reject)=>{
      statistics.find({}, (err, stats) => {
        if(err) reject(err);
        resolve(stats);
      });
    }).then((data)=>{
      let stats = [];
      data.forEach((x, i)=>{
        let totalSales = x.sales.reduce((total, x)=>{return total+x.qt},0);
        let totalrevenue = x.sales.reduce((total, x)=>{return total+x.revenue},0);
        stats.push({
          'name' : x.name,
          'sales' : totalSales,
          'revenue' : totalrevenue
        });
      });
      $scope.$apply(()=>{
        if(stats.length<5){
          $scope.top5Sales = stats.sort((a,b)=>{ return b.sales-a.sales }).slice(0, stats.length);
          $scope.top5Revenue = stats.sort((a,b)=>{ return b.revenue-a.revenue }).slice(0, stats.length);
        }else{
          $scope.top5Sales = stats.sort((a,b)=>{ return b.sales-a.sales }).slice(0, 5);
          $scope.top5Revenue = stats.sort((a,b)=>{ return b.revenue-a.revenue }).slice(0, 5);
        }
      });
    }).catch((err)=>{
      console.log(err);
    });
  }
  $scope.createChart = () => {
    let totalSales = {};
    let totalRevenue = {};
    let topSales = {};
    let topRevenue = {};

    new Promise((resolve, reject)=>{
      let thisMonth = new RegExp(new Date().toISOString().substring(0,7).replace("-", "\\-"),"i");
      sales.find({'createdAt':{$regex:thisMonth}}, (err, lists)=>{
        lists.forEach(x=>totalSales[x.createdAt]=(totalSales[x.createdAt]||0)+x.totalPrice);
        lists.forEach(x=>totalRevenue[x.createdAt]=(totalRevenue[x.createdAt]||0)+x.totalRevenue);

        lists.forEach(x=>{
          x.orders.forEach(y=>{
            topSales[y.name]=(topSales[y.name]||0)+Number(y.qt);
            topRevenue[y.name]=(topRevenue[y.name]||0)+(y.price-(Number(y.base_price)*Number(y.qt)));
          });
        });


        //createChart

        new Chart(document.getElementById("chart"), {
          type: 'line',
          data: {
            labels: $scope.getSortedValues(totalSales).keys.map(x => {return x.substring(8,10)}),
            datasets: [{
                data: $scope.getSortedValues(totalSales).values,
                label: "Sales",
                borderColor: "#3e95cd",
                fill: false
              },
              {
                  data:  $scope.getSortedValues(totalRevenue).values,
                  label: "Revenue",
                  borderColor: "#8e5ea2",
                  fill: false
                }]
          },
          options: {
            title: {
              display: true,
              text: 'Statistics in a month'
            }
          }
        });

        //topSales in a month
        new Chart(document.getElementById('chart-topSales'), {
          type:'doughnut',
          data:{
            labels:$scope.getSortedKeys(topSales).labels.slice(0,5),
            datasets: [{
              data: $scope.getSortedKeys(topSales).values.slice(0,5),
              backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
            }]
          },
          options: {
            legend:{
              display:false
            },
            title: {
              display: true,
              text: 'Top 5 Sales in a month'
            }
          }
        });

        //topSales in a month
        new Chart(document.getElementById('chart-topRevenue'), {
          type:'doughnut',
          data:{
            labels:$scope.getSortedKeys(topRevenue).labels.slice(0,5),
            datasets: [{
              data: $scope.getSortedKeys(topRevenue).values.slice(0,5),
              backgroundColor: ["#c45850", "#e8c3b9", "#8e5ea2","#3cba9f","#3e95cd"],
            }]
          },
          options: {
            legend:{
              display:false
            },
            title: {
              display: true,
              text: 'Top 5 Revenue in a month'
            }
          }
        });


      });
    }).then((data)=>{
      console.log('test', data);
    }).catch((err)=>{
      console.log(err);
    });
  };
  $scope.getSortedKeys = (obj) => {
    let keys = []; for(var key in obj) keys.push(key);
    let labels = keys.sort((a,b)=>{return obj[b]-obj[a];});
    let values = []; labels.forEach(x=>{values.push(obj[x]);});
    return {labels:labels, values:values};
  };

  $scope.getSortedValues = (obj) =>{
    let keys = Object.keys(obj).map(x=>{return x;}).sort();
    let values = [];
    keys.forEach(x=>{
      values.push(obj[x]);
    });
    return {keys:keys, values:values};
  };

  $scope.loadNotif();
  $scope.loadStatistic();
  $scope.createChart();
});

app.controller('posController', function($scope){
  loadProducts({}).then((products)=>{
    document.getElementById('spinner').style.display = 'none';
    $scope.inventories=products.filter(x=>x.status==true&&x.quantity!=0);
    $scope.cart = [];
    $scope.sales = [];
    $scope.orders = [];
    $scope.totalPrice = 0;
    $scope.inventories.forEach((x,i)=>{$scope.cart[i]={id:x._id, name:x.name, sell_price:x.sell_price, base_price:x.base_price, active:false, qt:0, price:0};});
    $scope.$apply();
  }).catch((err)=>{
    if(err) console.log(err);
  });
  $scope.loadSales = () => {
    new Promise((resolve, reject)=>{
      sales.find({}).sort({createdAt:-1}).exec((err, lists)=>{
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
      orders.find({}).sort({date:-1}).exec((err, lists)=>{
        if(err) reject(err);
        resolve(lists);
      });
    }).then((data)=>{
      data.forEach((x)=>{
        x.total = x.items.reduce((total, x)=> {return Number(total) + Number(x.totalPrice)}, 0);
      });
      document.getElementById('spinner-ordersHistory').style.display = 'none';
      $scope.$apply(()=>{
        $scope.orders = data;
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
    let totalRevenue = 0;
    $scope.cart.forEach((x,i)=>{
      if(x.active){
        //update front
        $scope.inventories[i].quantity = Number($scope.inventories[i].quantity)-Number(x.qt);
        //update db
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
        //update insert statistics
        totalRevenue += (Number($scope.inventories[i].sell_price)-Number($scope.inventories[i].base_price))*Number(x.qt);
        statistics.update({'product_id':x.id},{
          $set:{
            'name':$scope.inventories[i].name,
          },
          $push:{'sales':{
            'qt':Number(x.qt),
            'revenue':(Number($scope.inventories[i].sell_price)-Number($scope.inventories[i].base_price))*Number(x.qt),
            'date':new Date().toISOString().substring(0,10)
          }}
        }, {'upsert':true}, (err)=>{
          if(err) console.log(err);
          console.log('statistic created');
        });
      }
    });
    //insert to sales
    console.log(totalRevenue)
    sales.insert({
                  'createdAt':new Date().toISOString().substring(0,10),
                  'totalPrice':$scope.totalPrice,
                  'orders':$scope.cart.filter(x=>x.active===true),
                  'totalRevenue':totalRevenue
                },
    (err, newSale) => {
      if(err) console.log(err);
    });

    loadProducts({}).then((products)=>{
      document.getElementById('spinner').style.display = 'none';
      $scope.inventories=products.filter(x=>x.status==true&&x.quantity!=0);
      $scope.cart = [];
      $scope.sales = [];
      $scope.orders = [];
      $scope.totalPrice = 0;
      $scope.inventories.forEach((x,i)=>{$scope.cart[i]={id:x._id, name:x.name, sell_price:x.sell_price, base_price:x.base_price, active:false, qt:0, price:0};});
      $scope.$apply();
    }).catch((err)=>{
      if(err) console.log(err);
    });

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
  $scope.resetSpinner = () => {
    // document.getElementById('spinner-salesHistory').style.display = 'block';
    // document.getElementById('spinner-ordersHistory').style.display = 'block';
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

      //new object
      $scope.newProduct.base_price = Number(angular.element('#basePrice').val());
      $scope.newProduct.name = angular.element('#newProduct_value').val();
      $scope.newProduct.quantity = Number(angular.element('#quantity').val());
      $scope.newProduct.sell_price = Number(angular.element('#sellPrice').val());
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
              'quantity':Number($scope.newProduct.quantity),
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
