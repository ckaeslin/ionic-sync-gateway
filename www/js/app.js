// Ionic Starter App

var freshupDatabase = null;

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

.run(function($ionicPlatform, $pouchDB) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    /*$pouchDB.setDatabase("freshup");
    $pouchDB.sync("http://192.168.1.107:4984/freshup");*/

  });
})
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state("lessons", {
            "url": "/lessons",
            "templateUrl": "templates/lessons.html",
            "controller": "MainController"
        })
        .state("lesson", {
            "url": "/lesson/:lessonId/:documentRevision",
            "templateUrl": "templates/lesson.html",
            "controller": "MainController"
        });
    $urlRouterProvider.otherwise("lessons");
})
.controller("MainController", function($scope, $rootScope, $state, $stateParams, $pouchDB) {
  $scope.lessons = {};

  /*$pouchDB.startListening();*/

  // Listen for changes which include create or update events
  $rootScope.$on("$pouchDB:change", function(event, data) {
      $scope.lessons[data.doc._id] = data.doc;
      $scope.$apply();
  });

  // Listen for changes which include only delete events
  $rootScope.$on("$pouchDB:delete", function(event, data) {
      delete $scope.lessons[data.doc._id];
      $scope.$apply();
  });

  // Look up a document if we landed in the info screen for editing a document
  if($stateParams.lessonId) {
      /*$pouchDB.get($stateParams.lessonId).then(function(result) {
          $scope.inputForm = result;
      });*/
  }

  // Save a document with either an update or insert
  $scope.save = function(title, date) {
      var jsonDocument = {
          "title": title,
          "date": date,
      };
      // If we're updating, provide the most recent revision and document id
      if($stateParams.lessonId) {
          jsonDocument["_id"] = $stateParams.lessonId;
          jsonDocument["_rev"] = $stateParams.documentRevision;
      }
      $pouchDB.save(jsonDocument).then(function(response) {
          $state.go("lessons");
      }, function(error) {
          console.log("ERROR -> " + error);
      });
  };

  $scope.delete = function(id, rev) {
    $pouchDB.delete(id, rev);
  };
})
.service("$pouchDB", ["$rootScope", "$q", function($rootScope, $q) {

    var database;
    var changeListener;

    /*this.setDatabase = function(databaseName) {
        database = new PouchDB(databaseName);
    };*/

    this.startListening = function() {
        changeListener = database.changes({
            live: true,
            include_docs: true
        }).on("change", function(change) {
            if(!change.deleted) {
                $rootScope.$broadcast("$pouchDB:change", change);
            } else {
                $rootScope.$broadcast("$pouchDB:delete", change);
            }
        });
    };

    this.stopListening = function() {
        changeListener.cancel();
    };

    this.sync = function(remoteDatabase) {
        database.sync(remoteDatabase, {live: true, retry: true});
    };

    this.save = function(jsonDocument) {
        var deferred = $q.defer();
        if(!jsonDocument._id) {
            database.post(jsonDocument).then(function(response) {
                deferred.resolve(response);
            }).catch(function(error) {
                deferred.reject(error);
            });
        } else {
            database.put(jsonDocument).then(function(response) {
                deferred.resolve(response);
            }).catch(function(error) {
                deferred.reject(error);
            });
        }
        return deferred.promise;
    };

    this.delete = function(documentId, documentRevision) {
        return database.remove(documentId, documentRevision);
    };

    this.get = function(documentId) {
        return database.get(documentId);
    };

    this.destroy = function() {
        database.destroy();
    };

}]);




